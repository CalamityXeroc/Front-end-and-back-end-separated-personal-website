<template>
  <div class="maps">
    <div class="map-header">
      <h1>我的地图</h1>
      <p>正在开发中……</p>
    </div>
    
    <div class="map-wrapper">
      <div v-if="loading" class="loading-message">
        <p>地图加载中...</p>
      </div>
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>
      
      <!-- 图例组件 -->
      <div class="map-legend" v-show="!loading">
        <h4>中国森林覆盖率</h4>
        <div class="legend-scale">
          <span style="background: #f7fcf5"></span>
          <span style="background: #e5f5e0"></span>
          <span style="background: #c7e9c0"></span>
          <span style="background: #a1d99b"></span>
          <span style="background: #74c476"></span>
          <span style="background: #41ab5d"></span>
          <span style="background: #238b45"></span>
          <span style="background: #005a32"></span>
        </div>
        <div class="legend-labels">
          <span>0%</span>
          <span style="margin-left: auto">70%+</span>
        </div>
        <p class="legend-source">点击省份查看详情</p>
      </div>

      <div id="map" class="map-container"></div>
    </div>
  </div>
</template>

<script>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default {
  name: 'Maps',
  setup() {
    let map = null;
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        console.log('开始初始化天地图...');
        
        mapboxgl.accessToken = 'pk.eyJ1IjoieGVyb2MiLCJhIjoiY21lenIyeWk4MXRuOTJrcTVjMWIwMXc3dCJ9.nMoRkxxiCpnFxmZ1H-ScwQ';
        
        map = new mapboxgl.Map({
          container: 'map',
          style: {
            version: 8,
            sources: {
              'tdt-vec': {
                type: 'raster',
                tiles: [
                  'http://localhost:3001/api/tdt/vec_w/{z}/{x}/{y}'
                ],
                tileSize: 256
              },
              'tdt-cva': {
                type: 'raster',
                tiles: [
                  'http://localhost:3001/api/tdt/cva_w/{z}/{x}/{y}'
                ],
                tileSize: 256
              }
            },
            layers: [
              {
                id: 'tdt-vec-layer',
                type: 'raster',
                source: 'tdt-vec',
                minzoom: 0,
                maxzoom: 18,
                paint: { 'raster-opacity': 1 }
              }
            ]
          },
          center: [105, 36],
          zoom: 3.5,
          minZoom: 3,
          maxZoom: 18,
          pitch: 0, // 初始倾斜角度
          bearing: 0
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', async () => {
          console.log('天地图加载完成');
          loading.value = false;
          
          try {
            const [geoRes, csvRes] = await Promise.all([
              fetch('/geoData/中国_省.geojson'),
              fetch('/geoData/全国各省森林覆盖率2022.csv')
            ]);

            if (!geoRes.ok) throw new Error(`GeoJSON加载失败: ${geoRes.status}`);
            if (!csvRes.ok) throw new Error(`CSV加载失败: ${csvRes.status}`);

            const geoData = await geoRes.json();
            const csvText = await csvRes.text();

            const forestDataMap = {};
            const rows = csvText.split('\n');
            rows.forEach((row, index) => {
              if (index === 0 || !row.trim()) return; 
              const cols = row.split(',');
              if (cols.length >= 3) {
                const provinceName = cols[1].trim();
                const rate = parseFloat(cols[2].trim());
                forestDataMap[provinceName] = rate;
              }
            });

            geoData.features.forEach(feature => {
              const name = feature.properties.name;
              let rate = forestDataMap[name];
              if (rate === undefined) {
                 const key = Object.keys(forestDataMap).find(k => k.includes(name) || name.includes(k));
                 if (key) rate = forestDataMap[key];
              }
              // 平面展示不需要 height
              feature.properties.forestRate = rate || 0;
            });

            map.addSource('china-provinces', {
              type: 'geojson',
              data: geoData
            });

            // 1. 平面分级设色层 (Fill)
            map.addLayer({
              id: 'china-forest-fill',
              type: 'fill',
              source: 'china-provinces',
              paint: {
                'fill-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'forestRate'],
                  0, '#f7fcf5',
                  10, '#e5f5e0',
                  20, '#c7e9c0',
                  30, '#a1d99b',
                  40, '#74c476',
                  50, '#41ab5d',
                  60, '#238b45',
                  70, '#005a32'
                ],
                'fill-opacity': 0.8,
                'fill-outline-color': '#00441b' // 添加边界线
              }
            });

            // 2. 高亮轮廓层 (点击选中时显示)
            map.addLayer({
              id: 'china-forest-highlight',
              type: 'line',
              source: 'china-provinces',
              paint: {
                'line-color': '#fbb03b',
                'line-width': 3,
                'line-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  1,
                  0
                ]
              }
            });

            // 3. 将注记层放在最上面，保证文字不被遮挡
            map.addLayer({
              id: 'tdt-cva-layer',
              type: 'raster',
              source: 'tdt-cva',
              minzoom: 0,
              maxzoom: 18
            });

            // --- 交互逻辑 ---

            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 25
            });

            let hoveredStateId = null;

            // 鼠标移动交互
            map.on('mousemove', 'china-forest-fill', (e) => {
              if (e.features.length > 0) {
                map.getCanvas().style.cursor = 'pointer';
                const feature = e.features[0];
                
                const props = feature.properties;
                
                popup.setLngLat(e.lngLat)
                  .setHTML(`
                    <div style="font-family: 'PingFang SC', sans-serif; padding: 8px; min-width: 120px;">
                      <h3 style="margin:0 0 8px 0; font-size:16px; color:#333; border-bottom:2px solid #41ab5d; padding-bottom:4px;">${props.name}</h3>
                      <div style="font-size:14px; color:#666;">
                        森林覆盖率: <b style="color:#238b45; font-size:18px;">${props.forestRate}%</b>
                      </div>
                    </div>
                  `)
                  .addTo(map);
              }
            });

            map.on('mouseleave', 'china-forest-fill', () => {
              map.getCanvas().style.cursor = '';
              popup.remove();
            });

            // 点击飞入交互 (FlyTo)
            map.on('click', 'china-forest-fill', (e) => {
              const feature = e.features[0];
              
              // 简单的飞入效果
              map.flyTo({
                center: e.lngLat,
                zoom: 6,
                speed: 0.8,
                curve: 1,
                essential: true
              });
            });

            // 点击空白处复位
            map.on('click', (e) => {
              const features = map.queryRenderedFeatures(e.point, { layers: ['china-forest-fill'] });
              if (!features.length) {
                map.flyTo({
                  center: [105, 36],
                  zoom: 3.5,
                  pitch: 0,
                  bearing: 0
                });
              }
            });

          } catch (err) {
            console.error('加载并处理数据失败:', err);
          }
        });

        map.on('error', (e) => {
          console.error('地图错误:', e);
        });
        
      } catch (err) {
        console.error('地图初始化失败:', err);
        error.value = `地图初始化失败: ${err.message}`;
        loading.value = false;
      }
    });

    onBeforeUnmount(() => {
      if (map) {
        map.remove();
      }
    });

    return {
      loading,
      error
    };
  }
};
</script>

<style scoped>
.maps {
  padding: 0;
  margin: 0;
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.map-header {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: transparent;
  padding: 0;
  pointer-events: none;
}

.map-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  color: #ffffff;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.map-header p {
  margin: 8px 0 0 0;
  font-size: 16px;
  text-align: center;
  color: #ffffff;
  text-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.2);
  font-weight: 300;
  letter-spacing: 0.5px;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: default !important;
}

.map-container >>> .mapboxgl-canvas-container {
  cursor: default !important;
}

.map-container >>> .mapboxgl-canvas {
  cursor: inherit !important;
}

.loading-message,
.error-message {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1000;
}

.error-message {
  color: #f56c6c;
}

/* Legend Styles */
.map-legend {
  position: absolute;
  bottom: 30px;
  right: 30px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  z-index: 100;
  min-width: 250px;
  backdrop-filter: blur(5px);
}

.map-legend h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.legend-scale {
  display: flex;
  width: 100%;
  height: 12px;
  margin-bottom: 5px;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.05);
}

.legend-scale span {
  flex: 1;
  height: 100%;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.legend-source {
  margin: 0;
  font-size: 12px;
  color: #888;
  text-align: left;
  border-top: 1px solid #eee;
  padding-top: 8px;
  line-height: 1.5;
}

.mapboxgl-ctrl-top-right {
  top: 20px;
  right: 20px;
}
</style>