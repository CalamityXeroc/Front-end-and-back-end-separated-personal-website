<template>
  <div class="gis-agent-wrapper">
    <div class="page-container">
      <!-- Hero -->
      <div class="profile-header">
        <h1>🤖 GIS Agent</h1>
        <p class="tagline">“听懂需求、自己规划、调用 ArcPy 完成分析与出图的 GIS 智能体。”</p>
        <div class="hero-actions">
          <a href="https://github.com/CalamityXeroc/GIS-agent.git" target="_blank" class="btn-link">
            GitHub 仓库
          </a>
          <router-link to="/about" class="btn-link btn-ghost">返回关于我</router-link>
        </div>
      </div>

      <!-- 项目简介 -->
      <section class="card">
        <h2>💡 项目简介</h2>
        <p class="intro-text">
          GIS Task CLI 是一个面向 ArcGIS Pro 工作流的 GIS 任务智能体，参考 Claude Code 的 Agent
          架构搭建，形成「下达 → 规划 → 执行 → 自检」的完整闭环。下面从原理、工作方式、使用方式和环境要求四个角度展开说。
        </p>
        <div class="arch-flow">
          <div class="arch-step"><span class="arch-icon">🗣️</span>自然语言任务</div>
          <div class="arch-arrow">→</div>
          <div class="arch-step"><span class="arch-icon">🧭</span>Planner 规划</div>
          <div class="arch-arrow">→</div>
          <div class="arch-step"><span class="arch-icon">🛠️</span>ArcPy 工具链执行</div>
          <div class="arch-arrow">→</div>
          <div class="arch-step"><span class="arch-icon">✅</span>成果自检与验收</div>
        </div>

        <div class="sub-section">
          <h3>🧠 工作原理</h3>
          <p>
            核心是 <code>GISAgent</code> 主类，它协调四个子系统共同完成一次对话：
          </p>
          <ul>
            <li><strong>Memory 会话记忆</strong>：保存对话历史与已执行的上下文，避免重复请求同一份数据、重复写同一个结论</li>
            <li><strong>Planner 双路规划器</strong>：规则推理优先匹配关键词/意图库，命中後生成确定性执行计划；未命中则回退到 LLM 推理（可配合 RAG 检索本地知识）生成结构化计划，API 异常或超时会自动回退到规则规划</li>
            <li><strong>Executor 执行器</strong>：按计划调度 <code>ToolRegistry</code> / <code>SkillRegistry</code> 里登记的工具与技能，节点化执行，失败节点会按配置化的恢复策略自动降级或重跑</li>
            <li><strong>LLM 客户端抽象</strong>：支持 OpenAI 兼容接口 / 本地模型 / Mock，通过 <code>config/llm_config.json</code> 或 BAML 函数映射接入国产模型</li>
          </ul>
          <p>
            每个任务还配套结构化的 Benchmark 题库（prompt + requirements + assertions），
            Agent 的产出会被逐条断言核验，这正是下面大赛实测部分的验收依据。
          </p>
        </div>

        <div class="sub-section">
          <h3>⚙️ 工作方式</h3>
          <ul>
            <li><strong>工作区约定</strong>：所有数据都在 <code>workspace/</code> 下运转——<code>input/</code> 放输入数据，<code>output/</code> 存最终成果，<code>temp/</code> 存中间文件，Agent 启动时会自动扫描识别输入文件</li>
            <li><strong>对话式驱动</strong>：支持中文自然语言输入，不需要记住 GIS 专业术语，也支持单次任务执行（<code>run</code>）或从文档解析任务
            </li>
            <li><strong>节点化执行与自动恢复</strong>：工作流被拆解为 <code>workflow_nodes</code>，未命中的节点会跳过并记录证据；未实现的节点自动替换为降级节点，ArcPy 不可用时自动强制 dry-run，所有决策写入 <code>strategy_applied</code> 便于审计</li>
            <li><strong>可选 LLM 增强</strong>：默认规则规划即可跑通；配置 API Key 后能理解任意自然语言推示，不再局限于 GIS 关键词</li>
          </ul>
        </div>

        <div class="sub-section">
          <h3>▶️ 使用方式</h3>
          <p>安装后最常用的命令：</p>
          <pre class="code-block"><code># 安装（可编辑模式）
pip install -e .

# 启动交互式 Agent 会话（推荐）
gis-agent chat

# 单次任务执行（预览/实执）
gis-agent run "整合数据并导出专题图" --dry-run

# 传统工作流：从自然语言建任务 → 生成计划 → 执行
gis-cli task-create "整合 9 个分幅数据，统一投影并导出专题图"
gis-cli task-plan &lt;task-id&gt;
gis-cli task-run &lt;task-id&gt; --dry-run

# 启动 Web UI / API
gis-cli-ui      # 可视化页面，默认 http://localhost:8501
gis-cli-api     # FastAPI 服务接口</code></pre>
          <p class="note-text">
            若需输出真实 GIS 成果（.gdb / 地图导出），需在 ArcGIS Pro 自带的 Python 环境下运行并加 <code>--exec</code>；
            否则默认 <code>--dry-run</code> 预演，只输出计划 JSON 与降级报告。
          </p>
        </div>

        <div class="sub-section">
          <h3>🧰 环境要求</h3>
          <ul>
            <li><strong>Python</strong>：≥ 3.10</li>
            <li><strong>核心依赖</strong>：typer、pydantic、openai、litellm、langchain + chromadb（RAG 检索）</li>
            <li><strong>可选依赖</strong>：fastapi/uvicorn/streamlit（Web UI 与 API）、python-docx/pypdf（文档任务解析）</li>
            <li><strong>ArcGIS Pro</strong>（可选但强烈推荐）：需要自带 arcpy 的 ArcGIS Pro Python 环境才能输出真实 .gdb / JPG 成果；未安装时自动降级为计划/报告输出，不会报错中止</li>
            <li><strong>LLM API Key</strong>（可选）：在 <code>config/llm_config.json</code> 配置兼容 OpenAI 接口的密钥即可启用自然语言规划增强，该文件已在 <code>.gitignore</code> 中排除，不会上传</li>
          </ul>
        </div>

        <div class="tech-stack">
          <span>Python</span>
          <span>AI Agent</span>
          <span>ArcPy</span>
          <span>FastAPI</span>
          <span>LLM 编排</span>
          <span>Benchmark 验收</span>
        </div>
      </section>

      <!-- 大赛真题实测 -->
      <section class="card">
        <h2>🏆 大赛真题实测</h2>
        <p class="section-desc">
          以下示例均来自<strong>全国大学生 GIS 应用技能大赛</strong>真题（第 13 届 · 兰州交通大学 / 第 14 届 · 2025），
          由 Agent 在无人干预下端到端完成。点击图片可放大查看。
        </p>

        <!-- 示例 1 -->
        <div class="example">
          <div class="example-head">
            <span class="badge badge-green">第 14 届真题 · 上午卷（任务一 ~ 三）</span>
            <h3>数据清洗与栅格处理：从 3596 条原始记录到可信分析底座</h3>
          </div>
          <div class="example-body">
            <div class="example-text">
              <h4>任务要求</h4>
              <ul>
                <li>清洗野生动物观测数据：拆分打包记录、剔除缺失 / 重复 / 错误区域、纠正经纬度半球错误</li>
                <li>DEM 三幅拼接、投影到 UTM 10N 并按研究区裁剪（30 m）</li>
                <li>土地覆盖栅格云区修补：261 个云像元，多尺度邻域众数替换</li>
                <li>455 个气象站 IDW 温度插值（500 m），抽取 10% 站点做精度检验</li>
              </ul>
              <h4>源数据</h4>
              <p>
                animal.txt 原始观测 3596 条（GBK 编码、含打包记录与半球写错的坐标）、
                三幅分幅 DEM、土地覆盖栅格（含云像元）、气象站观测表。
              </p>
              <blockquote>
                「拆分打包记录 +21、剔除缺失 23、去重 67、剔除错误区域 52、纠正纬度符号 9、
                纠正经度半球 8……最终 3464 条」；「IDW 插值中误差 0.325 ℃（45 个检核点），判定达标（≤ 0.5 ℃）」
                <cite>—— Agent 自主产出的清洗报告与插值精度报告</cite>
              </blockquote>
            </div>
            <div class="example-images two">
              <figure class="thumb" @click="openLightbox('/picture/gis-agent/preview.jpg', '第14届上午题 Agent 实测产出')">
                <img src="/picture/gis-agent/preview.jpg" alt="第14届上午题 Agent 实测产出四宫格">
                <figcaption>实测产出总览</figcaption>
              </figure>
              <figure class="thumb" @click="openLightbox('/picture/gis-agent/cloud-fix.jpg', '土地覆盖云区修补前后对比')">
                <img src="/picture/gis-agent/cloud-fix.jpg" alt="土地覆盖云区修补前后对比" loading="lazy">
                <figcaption>云区修补前后对比</figcaption>
              </figure>
            </div>
          </div>
        </div>

        <!-- 示例 2 -->
        <div class="example">
          <div class="example-head">
            <span class="badge badge-green">第 14 届真题 · 上午卷（任务四 a）</span>
            <h3>时空分析与统一图例系列制图：四期核密度 + 分布中心迁移</h3>
          </div>
          <div class="example-body">
            <div class="example-text">
              <h4>任务要求</h4>
              <ul>
                <li>每 5 年一期（共 4 期）核密度分析：搜索邻域面积 100 km²（半径 ≈ 5642 m）、像元 100 m</li>
                <li>四期密度图必须共用同一分级图例（验收断言逐图核对分级边界完全一致）</li>
                <li>逐年计算野生动物分布中心，绘制 1982—2001 年迁移路线图</li>
              </ul>
              <h4>源数据</h4>
              <p>清洗投影后的 animal_points.shp（3464 个点位，含 YEAR / NAME 字段）与研究区矩形范围。</p>
              <blockquote>
                「run_recipe(recipe_id='kernel_density', neighborhood_area_km2=100 …) 一次算好四期栅格，
                返回各期最大值与建议的统一分级边界」；验收结果：「4 份 .spec.json 实测分级完全一致，四张成果图同图例」
                <cite>—— 题库验收断言实际通过记录</cite>
              </blockquote>
            </div>
            <div class="example-images two">
              <figure class="thumb" @click="openLightbox('/picture/gis-agent/kde-1982.jpg', '1982-1986 野生动物核密度分布图')">
                <img src="/picture/gis-agent/kde-1982.jpg" alt="1982-1986 野生动物核密度分布图" loading="lazy">>
                <figcaption>核密度图（1982—1986，统一图例之一）</figcaption>
              </figure>
              <figure class="thumb" @click="openLightbox('/picture/gis-agent/migration.jpg', '1982—2001 年野生动物分布中心迁移')">
                <img src="/picture/gis-agent/migration.jpg" alt="1982—2001 年野生动物分布中心迁移图" loading="lazy">
                <figcaption>分布中心迁移（1982—2001）</figcaption>
              </figure>
            </div>
          </div>
        </div>

        <!-- 示例 3 -->
        <div class="example">
          <div class="example-head">
            <span class="badge badge-blue">第 13 届真题 · 下午卷（PM）</span>
            <h3>社区绿地服务评价：像元级人口分摊 + 标杆 / 需整改遴选</h3>
          </div>
          <div class="example-body">
            <div class="example-text">
              <h4>任务要求</h4>
              <ul>
                <li>老年人口按人口密度栅格像元级分摊到社区（含百分比字段清洗、5 m 栅格重投影）</li>
                <li>计算人均绿地指数与绿地服务价值，遴选 32 个标杆社区与 500 个需整改社区</li>
                <li>合并类别字段出唯一值设色图（指定配色），同步交付可编辑 .aprx 工程，布局四要素齐全</li>
              </ul>
              <h4>源数据</h4>
              <p>district / community 面要素（含「老年人」百分比字符串字段，DBF 字段名被截断）、5 m 人口密度栅格、绿地分布数据。</p>
              <blockquote>
                验收断言：「三类别要素数 32 / 500 / 1809；渲染器为唯一值，标杆 = #1F77B4、
                需整改 = #2CA02C；图名 / 图例 / 比例尺 / 指北针齐全」—— 全部通过
                <cite>—— Benchmark 验收记录</cite>
              </blockquote>
            </div>
            <div class="example-images single">
              <figure class="thumb" @click="openLightbox('/picture/gis-agent/community.jpg', '社区绿地服务评价：标杆社区与需整改社区')">
                <img src="/picture/gis-agent/community.jpg" alt="社区绿地服务评价：标杆社区与需整改社区" loading="lazy">
                <figcaption>标杆社区与需整改社区评价图</figcaption>
              </figure>
            </div>
          </div>
        </div>

        <!-- 示例 4 -->
        <div class="example">
          <div class="example-head">
            <span class="badge badge-blue">第 13 届真题 · 上午卷（任务三）</span>
            <h3>人口统计与空间自相关：指标汇总 + 热点冷点探测</h3>
          </div>
          <div class="example-body">
            <div class="example-text">
              <h4>任务要求</h4>
              <ul>
                <li>区县人口 CSV（无公共键，仅中心点坐标）转点、空间连接后按位置汇总到 49 个地级市</li>
                <li>Getis-Ord Gi* 热点分析，识别 2011—2013 年人口热点 / 冷点集聚区</li>
                <li>普查三项指标（老年人占比、育龄女性占比、性别比）人口加权汇总到地市，并找出与郑州最相似的城市</li>
              </ul>
              <h4>源数据</h4>
              <p>county.shp（385 区县）、city.shp（49 地市）、population.CSV（2011—2020 逐年人口）、population_census.csv（普查指标）。</p>
              <blockquote>
                「空间连接 385 区县 → 汇总 49 地市（SUM_Y2011…，附 SRC_COUNT 计数核验）」；
                「与郑州最相似城市写入 similarity_zhengzhou.json，三项指标专题图同步交付 .aprx 工程」
                <cite>—— Agent 执行记录</cite>
              </blockquote>
            </div>
            <div class="example-images two">
              <figure class="thumb" @click="openLightbox('/picture/gis-agent/hotspot.jpg', '2011 年人口热点冷点分布图')">
                <img src="/picture/gis-agent/hotspot.jpg" alt="2011 年人口热点冷点分布图" loading="lazy">
                <figcaption>人口热点 / 冷点（2011，Getis-Ord Gi*）</figcaption>
              </figure>
              <figure class="thumb" @click="openLightbox('/picture/gis-agent/census-gender.jpg', '地市尺度性别比专题图')">
                <img src="/picture/gis-agent/census-gender.jpg" alt="地市尺度性别比专题图" loading="lazy">
                <figcaption>性别比专题图（人口加权汇总）</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <!-- 结语 -->
      <section class="card outro-card">
        <h2>📬 了解更多</h2>
        <p class="outro-text">
          完整的任务定义（YAML 题库）、验收断言与执行报告都在 GitHub 仓库中，欢迎 Star 与交流！
        </p>
        <div class="hero-actions">
          <a href="https://github.com/CalamityXeroc/GIS-agent.git" target="_blank" class="btn-link">
            GitHub 仓库
          </a>
          <router-link to="/about" class="btn-link btn-ghost">返回关于我</router-link>
        </div>
      </section>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxSrc" class="lightbox" @click="closeLightbox">
      <img :src="lightboxSrc" :alt="lightboxAlt">
      <p class="lightbox-caption">{{ lightboxAlt }}（点击任意处关闭）</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GisAgent',
  data() {
    return {
      lightboxSrc: '',
      lightboxAlt: ''
    }
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    openLightbox(src, alt) {
      this.lightboxSrc = src;
      this.lightboxAlt = alt;
    },
    closeLightbox() {
      this.lightboxSrc = '';
      this.lightboxAlt = '';
    },
    onKeydown(e) {
      if (e.key === 'Escape') this.closeLightbox();
    }
  }
}
</script>

<style scoped>
.gis-agent-wrapper {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  background: linear-gradient(180deg, #f4faf5 0%, #edf6ef 100%);
}

.page-container {
  max-width: 1040px;
  margin: 0 auto;
  padding: 48px 24px 56px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: var(--color-text-primary);
}

/* Hero */
.profile-header {
  text-align: center;
  margin-bottom: 48px;
  background: rgba(255, 255, 255, 0.94);
  padding: 36px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft-md);
  transform: translateZ(0);
}

.profile-header h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 14px;
  color: var(--color-text-primary);
}

.tagline {
  font-size: 1.15rem;
  color: var(--color-text-secondary);
  font-style: italic;
  margin-bottom: 24px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-link {
  --width: auto;
  display: inline-block;
  padding: 10px 24px;
  color: #fff;
  font-weight: bold;
  font-size: 1em;
  background: rgb(64, 192, 87);
  transition: all 0.2s;
  border-radius: 6px;
  text-decoration: none;
  text-align: center;
  border: 0;
  cursor: pointer;
}

.btn-link:hover {
  background: rgb(53, 168, 76);
  transform: scale(1.05) translateY(-1px);
}

.btn-ghost {
  background: #fff;
  color: var(--color-primary-dark);
  border: 1px solid var(--color-border-hover);
}

.btn-ghost:hover {
  background: #f1f8f2;
}

/* Cards */
.card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  padding: var(--spacing-3xl);
  box-shadow: var(--shadow-soft-md);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  transform: translateZ(0);
  margin-bottom: var(--spacing-3xl);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-soft-xl);
  border-color: var(--color-border-hover);
}

.card h2 {
  font-size: var(--font-size-2xl);
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
  color: var(--color-text-primary);
}

.intro-text,
.section-desc {
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: 20px;
}

/* 架构流程 */
.arch-flow {
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}

.arch-step {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.95rem;
}

.arch-icon {
  font-size: 1.15rem;
}

.arch-arrow {
  align-self: center;
  color: var(--color-text-secondary);
  font-weight: bold;
}

/* 子模块：工作原理/工作方式/使用方式/环境要求 */
.sub-section {
  margin: 24px 0;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.sub-section h3 {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.sub-section p,
.sub-section ul {
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.sub-section ul {
  padding-left: 1.2em;
  margin-bottom: 10px;
}

.sub-section li {
  margin-bottom: 6px;
}

.sub-section code {
  background: #eef6ef;
  color: #2e7d32;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.code-block {
  background: #0d1117;
  color: #c9d1d9;
  border-radius: 10px;
  padding: 16px 18px;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.7;
  margin-bottom: 12px;
}

.code-block code {
  background: none;
  color: inherit;
  padding: 0;
  white-space: pre;
}

.note-text {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  background: #f7faf7;
  border-left: 3px solid var(--color-primary);
  padding: 10px 14px;
  border-radius: 6px;
}

/* 技术栈标签 */
.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-stack span {
  font-size: 0.85rem;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 示例块 */
.example {
  border-top: 1px dashed var(--color-border);
  padding-top: 28px;
  margin-top: 28px;
}

.example:first-of-type {
  border-top: none;
  padding-top: 0;
  margin-top: 8px;
}

.example-head {
  margin-bottom: 18px;
}

.badge {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  padding: 3px 12px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.badge-green {
  background: linear-gradient(135deg, #2e7d32, #4caf50);
}

.badge-blue {
  background: linear-gradient(135deg, #1565c0, #42a5f5);
}

.example-head h3 {
  margin: 0;
  color: var(--color-primary-dark);
  font-size: 1.25rem;
  line-height: 1.5;
}

.example-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.example-text {
  flex: 1;
  min-width: 0;
}

.example-text h4 {
  margin: 16px 0 8px;
  color: var(--color-text-primary);
  font-size: 1.02rem;
}

.example-text h4:first-child {
  margin-top: 0;
}

.example-text ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.example-text p {
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin: 0;
}

blockquote {
  margin: 16px 0 0;
  padding: 12px 16px;
  background: #f1f8f2;
  border-left: 4px solid #4caf50;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.7;
}

blockquote cite {
  display: block;
  margin-top: 6px;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  font-style: normal;
  text-align: right;
}

/* 成果图 */
.example-images {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.example-images.two {
  width: min(100%, 460px);
}

.example-images.single {
  width: min(100%, 320px);
}

.thumb {
  margin: 0;
  flex: 1;
  min-width: 0;
  cursor: zoom-in;
  position: relative;
}

.thumb img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.thumb:hover img {
  transform: scale(1.02);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

.thumb figcaption {
  margin-top: 8px;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.5;
}

/* 结语 */
.outro-card {
  text-align: center;
}

.outro-text {
  color: var(--color-text-secondary);
  margin-bottom: 20px;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  padding: 24px;
}

.lightbox img {
  max-width: 100%;
  max-height: calc(100% - 56px);
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

.lightbox-caption {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  text-align: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .page-container {
    padding: 32px 16px 40px;
  }

  .profile-header {
    padding: 24px;
  }

  .card {
    padding: 20px;
  }

  .arch-flow {
    flex-direction: column;
    align-items: stretch;
  }

  .arch-arrow {
    display: none;
  }

  .example-body {
    flex-direction: column;
  }

  .example-text {
    width: 100%;
  }

  .example-images,
  .example-images.two,
  .example-images.single {
    width: 100%;
    margin-top: 16px;
  }

  .example-head h3 {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .profile-header h1 {
    font-size: 1.6rem;
  }

  .tagline {
    font-size: 0.9rem;
  }

  .card {
    padding: 16px;
  }

  .example-images.two {
    flex-direction: column;
  }

  .btn-link {
    font-size: 0.85rem;
    padding: 8px 16px;
  }
}
</style>
