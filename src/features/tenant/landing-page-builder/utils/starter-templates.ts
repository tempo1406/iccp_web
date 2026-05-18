/** Pre-built landing page templates for business management.
 *  When the user clicks "Use template", a copy is created in their org's
 *  template library via createTemplate mutation — no backend seeding needed.
 */

export const STARTER_TEMPLATES = [
  {
    id: 'businessflow',
    name: 'BusinessFlow',
    description: 'Modern business landing page with hero, services, stats, and CTA sections.',
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>BusinessFlow</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#0f172a;background:#fff;line-height:1.6}
a{text-decoration:none;color:inherit}
.wrap{width:min(100% - 40px,1160px);margin:0 auto}
/* NAV */
nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(14px);border-bottom:1px solid #e5e7eb}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:60px}
.logo{font-size:20px;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:10px}
.logo-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:grid;place-items:center;color:#fff;font-weight:800;font-size:14px}
.nav-links{display:flex;gap:28px}
.nav-links a{font-size:14px;font-weight:500;color:#64748b;transition:.2s}
.nav-links a:hover{color:#2563eb}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:.2s}
.btn-primary{background:#2563eb;color:#fff}
.btn-primary:hover{background:#1d4ed8}
.btn-outline{background:transparent;color:#2563eb;border:1.5px solid #2563eb}
.btn-outline:hover{background:#eff6ff}
/* HERO */
.hero{padding:80px 0 60px;text-align:center;background:linear-gradient(180deg,#f0f4ff 0%,#fff 100%)}
.hero-badge{display:inline-flex;align-items:center;gap:6px;background:#eff6ff;border:1px solid #bfdbfe;color:#2563eb;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;margin-bottom:20px}
.hero h1{font-size:clamp(36px,5.5vw,64px);font-weight:800;line-height:1.1;letter-spacing:-.03em;margin-bottom:18px;color:#0f172a}
.hero h1 span{color:#2563eb}
.hero p{font-size:18px;color:#64748b;max-width:600px;margin:0 auto 32px}
.hero-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
/* STATS */
.stats{background:#fff;padding:48px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.stat-val{font-size:36px;font-weight:800;color:#2563eb;letter-spacing:-.03em}
.stat-label{font-size:13px;color:#64748b;margin-top:4px}
/* SERVICES */
.services{padding:80px 0}
.section-head{text-align:center;margin-bottom:52px}
.section-head h2{font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
.section-head p{color:#64748b;font-size:16px;max-width:560px;margin:0 auto}
.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.service-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;transition:.25s}
.service-card:hover{box-shadow:0 12px 40px rgba(37,99,235,.1);border-color:#bfdbfe;transform:translateY(-4px)}
.service-icon{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#eff6ff,#dbeafe);display:grid;place-items:center;font-size:22px;margin-bottom:16px}
.service-card h3{font-size:17px;font-weight:700;margin-bottom:8px}
.service-card p{color:#64748b;font-size:14px;line-height:1.6}
/* FEATURES */
.features{padding:80px 0;background:#f8fafc}
.features-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.features-content h2{font-size:clamp(26px,3.5vw,40px);font-weight:800;letter-spacing:-.02em;margin-bottom:16px}
.features-content p{color:#64748b;font-size:16px;margin-bottom:28px}
.feature-list{display:flex;flex-direction:column;gap:14px}
.feature-item{display:flex;align-items:flex-start;gap:12px}
.feature-check{width:24px;height:24px;border-radius:50%;background:#2563eb;display:grid;place-items:center;flex-shrink:0;margin-top:2px}
.feature-check::after{content:"✓";color:#fff;font-size:12px;font-weight:700}
.feature-item p{font-size:14px;color:#374151;font-weight:500}
.features-visual{background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:20px;padding:32px;color:#fff}
.dash-title{font-size:18px;font-weight:700;margin-bottom:20px}
.dash-row{display:flex;justify-content:space-between;margin-bottom:12px}
.dash-item{background:rgba(255,255,255,.15);border-radius:10px;padding:14px 18px;flex:1;margin:0 4px;text-align:center}
.dash-num{font-size:24px;font-weight:800}
.dash-lbl{font-size:11px;opacity:.75;margin-top:2px}
.dash-bar-wrap{margin-top:16px}
.dash-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:12px}
.dash-bar-bg{flex:1;height:8px;background:rgba(255,255,255,.2);border-radius:4px}
.dash-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.7)}
/* TESTIMONIALS */
.testi{padding:80px 0}
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:48px}
.testi-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
.testi-quote{font-size:15px;color:#374151;line-height:1.65;margin-bottom:18px}
.testi-author{display:flex;align-items:center;gap:12px}
.testi-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:grid;place-items:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0}
.testi-name{font-weight:600;font-size:13px}
.testi-role{font-size:12px;color:#64748b;margin-top:2px}
/* CTA */
.cta{padding:80px 0}
.cta-box{background:linear-gradient(135deg,#1e3a8a,#2563eb 55%,#7c3aed);border-radius:24px;padding:52px 44px;text-align:center;color:#fff}
.cta-box h2{font-size:clamp(26px,4vw,42px);font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
.cta-box p{color:rgba(255,255,255,.82);font-size:16px;max-width:540px;margin:0 auto 28px}
.btn-white{background:#fff;color:#2563eb;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px}
.btn-white:hover{background:#f0f4ff}
/* FOOTER */
footer{background:#0f172a;color:rgba(255,255,255,.7);padding:52px 0 24px}
.footer-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:32px;margin-bottom:32px}
.footer-brand p{font-size:13px;margin-top:12px;line-height:1.7}
.footer-col h4{color:#fff;font-size:15px;font-weight:600;margin-bottom:14px}
.footer-col a{display:block;font-size:13px;margin-bottom:8px;transition:.2s}
.footer-col a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:20px;font-size:12px;text-align:center}
@media(max-width:768px){
.services-grid,.testi-grid,.footer-grid{grid-template-columns:1fr}
.features-grid{grid-template-columns:1fr}
.stats-grid{grid-template-columns:1fr 1fr}
.nav-links{display:none}
}
</style>
</head>
<body>
<nav><div class="wrap"><div class="nav-inner">
  <div class="logo"><div class="logo-mark">B</div>BusinessFlow</div>
  <div class="nav-links">
    <a href="#services">Dịch vụ</a>
    <a href="#features">Tính năng</a>
    <a href="#reviews">Đánh giá</a>
    <a href="#contact">Liên hệ</a>
  </div>
  <a href="#contact" class="btn btn-primary">Bắt đầu miễn phí</a>
</div></div></nav>

<section class="hero"><div class="wrap">
  <div class="hero-badge">✦ Giải pháp quản lý doanh nghiệp hiện đại</div>
  <h1>Tăng trưởng doanh nghiệp<br/>với <span>nền tảng thông minh</span></h1>
  <p>BusinessFlow giúp bạn quản lý toàn bộ hoạt động kinh doanh — từ vận hành, nhân sự đến tài chính — trên một nền tảng duy nhất.</p>
  <div class="hero-actions">
    <a href="#contact" class="btn btn-primary">Dùng thử miễn phí 14 ngày</a>
    <a href="#services" class="btn btn-outline">Xem tính năng</a>
  </div>
</div></section>

<section class="stats"><div class="wrap">
  <div class="stats-grid">
    <div><div class="stat-val">2,400+</div><div class="stat-label">Doanh nghiệp sử dụng</div></div>
    <div><div class="stat-val">98%</div><div class="stat-label">Tỷ lệ hài lòng</div></div>
    <div><div class="stat-val">3.5×</div><div class="stat-label">Tăng hiệu suất</div></div>
    <div><div class="stat-val">24/7</div><div class="stat-label">Hỗ trợ kỹ thuật</div></div>
  </div>
</div></section>

<section class="services" id="services"><div class="wrap">
  <div class="section-head">
    <h2>Giải pháp toàn diện cho doanh nghiệp</h2>
    <p>Từ quản lý nhân sự đến phân tích dữ liệu, BusinessFlow cung cấp đầy đủ công cụ bạn cần.</p>
  </div>
  <div class="services-grid">
    <div class="service-card"><div class="service-icon">📊</div><h3>Phân tích & Báo cáo</h3><p>Dashboard trực quan, báo cáo tự động theo thời gian thực giúp bạn ra quyết định nhanh chính xác.</p></div>
    <div class="service-card"><div class="service-icon">👥</div><h3>Quản lý nhân sự</h3><p>Tuyển dụng, chấm công, bảng lương và đánh giá hiệu suất nhân viên tập trung trên một hệ thống.</p></div>
    <div class="service-card"><div class="service-icon">🔄</div><h3>Tự động hóa quy trình</h3><p>Xây dựng và tự động hóa quy trình nghiệp vụ, giảm thiểu thao tác thủ công lên tới 70%.</p></div>
    <div class="service-card"><div class="service-icon">💰</div><h3>Quản lý tài chính</h3><p>Theo dõi doanh thu, chi phí, công nợ và lập kế hoạch ngân sách một cách minh bạch, dễ dàng.</p></div>
    <div class="service-card"><div class="service-icon">🤝</div><h3>Quản lý khách hàng</h3><p>CRM toàn diện giúp theo dõi toàn bộ vòng đời khách hàng từ tiếp cận đến chăm sóc sau bán hàng.</p></div>
    <div class="service-card"><div class="service-icon">📦</div><h3>Quản lý kho hàng</h3><p>Kiểm soát tồn kho, quản lý nhà cung cấp và tối ưu hóa chuỗi cung ứng một cách thông minh.</p></div>
  </div>
</div></section>

<section class="features" id="features"><div class="wrap">
  <div class="features-grid">
    <div class="features-content">
      <h2>Mọi thứ bạn cần để vận hành hiệu quả</h2>
      <p>Không cần nhiều phần mềm rời rạc. BusinessFlow tích hợp tất cả trong một nền tảng mạnh mẽ, dễ sử dụng.</p>
      <div class="feature-list">
        <div class="feature-item"><div class="feature-check"></div><p>Tích hợp hơn 50 ứng dụng phổ biến như Slack, Google Workspace, Zalo</p></div>
        <div class="feature-item"><div class="feature-check"></div><p>Bảo mật dữ liệu cấp doanh nghiệp, chứng chỉ ISO 27001</p></div>
        <div class="feature-item"><div class="feature-check"></div><p>Ứng dụng di động đầy đủ tính năng trên iOS và Android</p></div>
        <div class="feature-item"><div class="feature-check"></div><p>Hỗ trợ đa chi nhánh, phân quyền linh hoạt theo vai trò</p></div>
        <div class="feature-item"><div class="feature-check"></div><p>Báo cáo tùy chỉnh và xuất file Excel/PDF chỉ với một click</p></div>
      </div>
    </div>
    <div class="features-visual">
      <div class="dash-title">📈 Tổng quan tháng này</div>
      <div class="dash-row">
        <div class="dash-item"><div class="dash-num">₫ 4.2B</div><div class="dash-lbl">Doanh thu</div></div>
        <div class="dash-item"><div class="dash-num">1,240</div><div class="dash-lbl">Đơn hàng</div></div>
        <div class="dash-item"><div class="dash-num">98%</div><div class="dash-lbl">Hoàn thành</div></div>
      </div>
      <div class="dash-bar-wrap">
        <div class="dash-bar-row"><span style="width:70px">Kinh doanh</span><div class="dash-bar-bg"><div class="dash-bar" style="width:88%"></div></div><span>88%</span></div>
        <div class="dash-bar-row"><span style="width:70px">Nhân sự</span><div class="dash-bar-bg"><div class="dash-bar" style="width:75%"></div></div><span>75%</span></div>
        <div class="dash-bar-row"><span style="width:70px">Tài chính</span><div class="dash-bar-bg"><div class="dash-bar" style="width:92%"></div></div><span>92%</span></div>
        <div class="dash-bar-row"><span style="width:70px">Marketing</span><div class="dash-bar-bg"><div class="dash-bar" style="width:68%"></div></div><span>68%</span></div>
      </div>
    </div>
  </div>
</div></section>

<section class="testi" id="reviews"><div class="wrap">
  <div class="section-head"><h2>Khách hàng nói gì về chúng tôi</h2><p>Hàng nghìn doanh nghiệp đã và đang tin dùng BusinessFlow mỗi ngày.</p></div>
  <div class="testi-grid">
    <div class="testi-card"><p class="testi-quote">"BusinessFlow giúp chúng tôi tiết kiệm được 15 giờ làm việc thủ công mỗi tuần. Báo cáo tự động và dashboard rõ ràng giúp ban lãnh đạo ra quyết định nhanh hơn rất nhiều."</p><div class="testi-author"><div class="testi-avatar">NT</div><div><div class="testi-name">Nguyễn Thành</div><div class="testi-role">CEO, TechViet Solutions</div></div></div></div>
    <div class="testi-card"><p class="testi-quote">"Sau khi triển khai BusinessFlow, quy trình tuyển dụng của chúng tôi nhanh gấp đôi. Tính năng quản lý nhân sự thực sự ấn tượng và dễ sử dụng."</p><div class="testi-author"><div class="testi-avatar">MH</div><div><div class="testi-name">Mai Hương</div><div class="testi-role">HR Director, GreenBiz JSC</div></div></div></div>
    <div class="testi-card"><p class="testi-quote">"Tích hợp kế toán và kho hàng trong một hệ thống thực sự là điểm mạnh. Chúng tôi không còn phải nhập dữ liệu nhiều lần nữa. Hỗ trợ kỹ thuật cũng rất tốt."</p><div class="testi-author"><div class="testi-avatar">QA</div><div><div class="testi-name">Quốc Anh</div><div class="testi-role">COO, Saigon Retail Group</div></div></div></div>
  </div>
</div></section>

<section class="cta" id="contact"><div class="wrap">
  <div class="cta-box">
    <h2>Sẵn sàng chuyển đổi số doanh nghiệp?</h2>
    <p>Hơn 2,400 doanh nghiệp đã bắt đầu hành trình số hóa cùng BusinessFlow. Hãy là người tiếp theo.</p>
    <a href="#" class="btn btn-white">Dùng thử miễn phí 14 ngày →</a>
  </div>
</div></section>

<footer><div class="wrap">
  <div class="footer-grid">
    <div class="footer-brand"><div class="logo" style="color:#fff"><div class="logo-mark">B</div>BusinessFlow</div><p>Nền tảng quản lý doanh nghiệp toàn diện, giúp tổ chức của bạn vận hành thông minh hơn mỗi ngày.</p></div>
    <div class="footer-col"><h4>Sản phẩm</h4><a href="#">Tính năng</a><a href="#">Bảng giá</a><a href="#">Tích hợp</a><a href="#">API</a></div>
    <div class="footer-col"><h4>Công ty</h4><a href="#">Về chúng tôi</a><a href="#">Blog</a><a href="#">Tuyển dụng</a><a href="#">Liên hệ</a></div>
    <div class="footer-col"><h4>Hỗ trợ</h4><a href="#">Tài liệu</a><a href="#">Hướng dẫn</a><a href="#">Cộng đồng</a><a href="#">Hotline</a></div>
  </div>
  <div class="footer-bottom">© 2026 BusinessFlow. All rights reserved.</div>
</div></footer>
</body></html>`,
  },

  // ─────────────────────────────────────────────────────────────────────────────

  {
    id: 'teampulse',
    name: 'TeamPulse',
    description: 'Project and team management template with a minimal layout and bold teal accents.',
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>TeamPulse</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#111827;background:#fff;line-height:1.6}
a{text-decoration:none;color:inherit}
.wrap{width:min(100% - 40px,1140px);margin:0 auto}
nav{background:#fff;border-bottom:1px solid #f3f4f6;position:sticky;top:0;z-index:50}
.nav-i{display:flex;align-items:center;justify-content:space-between;height:62px}
.logo{font-size:19px;font-weight:800;display:flex;align-items:center;gap:10px}
.logo-dot{width:34px;height:34px;background:linear-gradient(135deg,#0ea5e9,#06b6d4);border-radius:10px;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:800}
.nl{display:flex;gap:26px}.nl a{font-size:14px;font-weight:500;color:#6b7280;transition:.2s}.nl a:hover{color:#0ea5e9}
.btn{display:inline-flex;align-items:center;gap:8px;padding:9px 20px;border-radius:8px;font-weight:600;font-size:14px;border:none;cursor:pointer;transition:.2s}
.btn-teal{background:#0ea5e9;color:#fff}.btn-teal:hover{background:#0284c7}
.btn-ghost{background:transparent;color:#0ea5e9;border:1.5px solid #e0f2fe}.btn-ghost:hover{background:#f0f9ff}
/* HERO */
.hero{padding:72px 0 56px;background:linear-gradient(160deg,#f0f9ff 0%,#fff 60%)}
.hero-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:#e0f2fe;color:#0284c7;padding:5px 13px;border-radius:99px;font-size:12px;font-weight:700;margin-bottom:20px;text-transform:uppercase;letter-spacing:.04em}
.hero h1{font-size:clamp(34px,5vw,58px);font-weight:800;line-height:1.1;letter-spacing:-.03em;margin-bottom:16px}
.hero h1 em{color:#0ea5e9;font-style:normal}
.hero p{color:#6b7280;font-size:17px;margin-bottom:28px}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap}
.board{background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(14,165,233,.15);padding:22px;border:1px solid #e0f2fe}
.board-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.board-title{font-weight:700;font-size:15px}
.board-date{font-size:12px;color:#9ca3af}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.col-head{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:8px}
.task{background:#f9fafb;border:1px solid #f3f4f6;border-radius:8px;padding:10px;margin-bottom:8px}
.task-tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;margin-bottom:6px}
.t-design{background:#fef3c7;color:#d97706}
.t-dev{background:#dbeafe;color:#2563eb}
.t-review{background:#d1fae5;color:#059669}
.task p{font-size:12px;color:#374151;font-weight:500}
.task-meta{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.task-ava{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:700;color:#fff}
.progress{height:4px;background:#e5e7eb;border-radius:2px;flex:1;margin-left:8px}
.progress-bar{height:100%;background:#0ea5e9;border-radius:2px}
/* LOGOS */
.logos{padding:36px 0;border-bottom:1px solid #f3f4f6;text-align:center}
.logos p{font-size:13px;color:#9ca3af;margin-bottom:18px;font-weight:500}
.logo-row{display:flex;justify-content:center;align-items:center;gap:36px;flex-wrap:wrap}
.logo-badge{background:#f9fafb;border:1px solid #f3f4f6;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:700;color:#6b7280}
/* FEATURES */
.features{padding:80px 0}
.sec-h{text-align:center;margin-bottom:52px}
.sec-h h2{font-size:clamp(26px,4vw,40px);font-weight:800;letter-spacing:-.02em;margin-bottom:10px}
.sec-h p{color:#6b7280;font-size:16px;max-width:520px;margin:0 auto}
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.feat-card{border:1px solid #f3f4f6;border-radius:16px;padding:26px;transition:.25s}
.feat-card:hover{border-color:#bae6fd;box-shadow:0 8px 30px rgba(14,165,233,.1)}
.feat-num{font-size:13px;font-weight:800;color:#0ea5e9;margin-bottom:12px;opacity:.7}
.feat-card h3{font-size:16px;font-weight:700;margin-bottom:8px}
.feat-card p{color:#6b7280;font-size:14px}
/* PRICING */
.pricing{padding:80px 0;background:#f0f9ff}
.price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:48px}
.price-card{background:#fff;border:1px solid #e0f2fe;border-radius:18px;padding:28px}
.price-card.featured{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.15)}
.price-tag{display:inline-block;background:#0ea5e9;color:#fff;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;margin-bottom:12px}
.price-name{font-size:16px;font-weight:700;margin-bottom:8px}
.price-val{font-size:38px;font-weight:800;color:#0f172a;letter-spacing:-.03em}
.price-val span{font-size:14px;font-weight:500;color:#9ca3af}
.price-list{margin:18px 0;display:flex;flex-direction:column;gap:9px}
.price-item{display:flex;align-items:center;gap:8px;font-size:13px;color:#374151}
.price-item::before{content:"✓";color:#0ea5e9;font-weight:700;font-size:13px}
/* CTA */
.cta{padding:80px 0}
.cta-inner{background:linear-gradient(135deg,#0f172a,#0ea5e9 80%);border-radius:24px;padding:52px;text-align:center;color:#fff}
.cta-inner h2{font-size:clamp(26px,4vw,42px);font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
.cta-inner p{color:rgba(255,255,255,.8);font-size:16px;max-width:500px;margin:0 auto 28px}
.btn-w{background:#fff;color:#0ea5e9;padding:13px 30px;border-radius:9px;font-weight:700;font-size:15px;display:inline-flex;align-items:center;gap:8px}
/* FOOTER */
footer{background:#0f172a;padding:44px 0 20px;color:rgba(255,255,255,.6)}
.foot-top{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:28px;margin-bottom:28px}
.foot-logo{color:#fff;font-size:18px;font-weight:800;display:flex;align-items:center;gap:10px;margin-bottom:10px}
.foot-col h5{color:#fff;font-size:14px;font-weight:600;margin-bottom:12px}
.foot-col a{display:block;font-size:13px;margin-bottom:7px;transition:.2s}.foot-col a:hover{color:#fff}
.foot-bottom{border-top:1px solid rgba(255,255,255,.08);padding-top:18px;text-align:center;font-size:12px}
@media(max-width:768px){.hero-grid,.cols{grid-template-columns:1fr}.feat-grid,.price-grid,.foot-top{grid-template-columns:1fr}.nl{display:none}}
</style>
</head>
<body>
<nav><div class="wrap"><div class="nav-i">
  <div class="logo"><div class="logo-dot">T</div>TeamPulse</div>
  <div class="nl"><a href="#features">Tính năng</a><a href="#pricing">Bảng giá</a><a href="#about">Về chúng tôi</a></div>
  <div style="display:flex;gap:10px">
    <a href="#" class="btn btn-ghost">Đăng nhập</a>
    <a href="#" class="btn btn-teal">Dùng miễn phí</a>
  </div>
</div></div></nav>

<section class="hero"><div class="wrap"><div class="hero-grid">
  <div>
    <div class="hero-tag">🚀 Mới — TeamPulse 3.0</div>
    <h1>Quản lý dự án<br/><em>thông minh hơn</em></h1>
    <p>Kết nối đội nhóm, theo dõi tiến độ và hoàn thành mục tiêu nhanh hơn với nền tảng quản lý dự án được thiết kế cho doanh nghiệp Việt.</p>
    <div class="hero-btns">
      <a href="#" class="btn btn-teal">Bắt đầu miễn phí</a>
      <a href="#features" class="btn btn-ghost">Xem demo</a>
    </div>
  </div>
  <div class="board">
    <div class="board-head"><span class="board-title">🗂 Sprint tháng 4/2026</span><span class="board-date">14 tasks</span></div>
    <div class="cols">
      <div><div class="col-head">Cần làm</div>
        <div class="task"><span class="task-tag t-design">Design</span><p>Thiết kế giao diện trang chủ</p><div class="task-meta"><div class="task-ava" style="background:#f97316">AN</div><div class="progress"><div class="progress-bar" style="width:20%"></div></div></div></div>
        <div class="task"><span class="task-tag t-dev">Dev</span><p>Tích hợp API thanh toán</p><div class="task-meta"><div class="task-ava" style="background:#8b5cf6">TH</div><div class="progress"><div class="progress-bar" style="width:0%"></div></div></div></div>
      </div>
      <div><div class="col-head">Đang làm</div>
        <div class="task"><span class="task-tag t-dev">Dev</span><p>Module báo cáo tự động</p><div class="task-meta"><div class="task-ava" style="background:#0ea5e9">LM</div><div class="progress"><div class="progress-bar" style="width:65%"></div></div></div></div>
        <div class="task"><span class="task-tag t-design">Design</span><p>UI Kit component library</p><div class="task-meta"><div class="task-ava" style="background:#ec4899">HN</div><div class="progress"><div class="progress-bar" style="width:80%"></div></div></div></div>
      </div>
      <div><div class="col-head">Hoàn thành</div>
        <div class="task"><span class="task-tag t-review">Review</span><p>Deploy môi trường staging</p><div class="task-meta"><div class="task-ava" style="background:#10b981">QT</div><div class="progress"><div class="progress-bar" style="width:100%"></div></div></div></div>
        <div class="task"><span class="task-tag t-review">Done</span><p>Tối ưu hiệu suất database</p><div class="task-meta"><div class="task-ava" style="background:#2563eb">PL</div><div class="progress"><div class="progress-bar" style="width:100%"></div></div></div></div>
      </div>
    </div>
  </div>
</div></div></section>

<div class="logos"><div class="wrap">
  <p>Tin dùng bởi các doanh nghiệp hàng đầu</p>
  <div class="logo-row">
    <span class="logo-badge">Vingroup</span>
    <span class="logo-badge">FPT Software</span>
    <span class="logo-badge">Momo</span>
    <span class="logo-badge">Tiki</span>
    <span class="logo-badge">VNG Corp</span>
  </div>
</div></div>

<section class="features" id="features"><div class="wrap">
  <div class="sec-h"><h2>Mọi thứ đội nhóm cần</h2><p>Từ lên kế hoạch đến báo cáo kết quả, TeamPulse đồng hành từng bước.</p></div>
  <div class="feat-grid">
    <div class="feat-card"><div class="feat-num">01</div><h3>Board Kanban thông minh</h3><p>Kéo thả task, theo dõi luồng công việc theo thời gian thực. Tùy chỉnh cột theo quy trình của bạn.</p></div>
    <div class="feat-card"><div class="feat-num">02</div><h3>Gantt Chart tự động</h3><p>Lập kế hoạch timeline dự án, phát hiện xung đột lịch và điều chỉnh deadline tự động khi có thay đổi.</p></div>
    <div class="feat-card"><div class="feat-num">03</div><h3>Báo cáo hiệu suất</h3><p>Dashboard phân tích hiệu suất cá nhân và nhóm, giúp quản lý đưa ra quyết định dựa trên dữ liệu.</p></div>
    <div class="feat-card"><div class="feat-num">04</div><h3>Chat tích hợp</h3><p>Nhắn tin theo task, mention đồng nghiệp và chia sẻ file ngay trong context công việc.</p></div>
    <div class="feat-card"><div class="feat-num">05</div><h3>Quản lý thời gian</h3><p>Bấm giờ làm việc, phân tích điểm tắc nghẽn và tối ưu hóa phân bổ nguồn lực nhóm.</p></div>
    <div class="feat-card"><div class="feat-num">06</div><h3>Tích hợp 80+ ứng dụng</h3><p>Kết nối với Slack, Jira, GitHub, Google Drive và hàng chục công cụ phổ biến khác qua API mở.</p></div>
  </div>
</div></section>

<section class="pricing" id="pricing"><div class="wrap">
  <div class="sec-h"><h2>Chọn gói phù hợp</h2><p>Miễn phí bắt đầu. Nâng cấp khi bạn cần thêm tính năng và thành viên.</p></div>
  <div class="price-grid">
    <div class="price-card"><div class="price-name">Starter</div><div class="price-val">Miễn phí<span>/tháng</span></div><div class="price-list"><div class="price-item">5 thành viên</div><div class="price-item">3 dự án đồng thời</div><div class="price-item">2GB lưu trữ</div><div class="price-item">Kanban cơ bản</div></div><a href="#" class="btn btn-ghost" style="width:100%;justify-content:center">Bắt đầu miễn phí</a></div>
    <div class="price-card featured"><div class="price-tag">Phổ biến nhất</div><div class="price-name">Pro</div><div class="price-val">₫ 299K<span>/tháng</span></div><div class="price-list"><div class="price-item">25 thành viên</div><div class="price-item">Dự án không giới hạn</div><div class="price-item">20GB lưu trữ</div><div class="price-item">Gantt Chart & báo cáo</div><div class="price-item">Tích hợp ứng dụng</div></div><a href="#" class="btn btn-teal" style="width:100%;justify-content:center">Dùng thử 14 ngày</a></div>
    <div class="price-card"><div class="price-name">Enterprise</div><div class="price-val">Liên hệ<span></span></div><div class="price-list"><div class="price-item">Không giới hạn thành viên</div><div class="price-item">SLA 99.9% uptime</div><div class="price-item">Lưu trữ không giới hạn</div><div class="price-item">SSO & quản trị nâng cao</div><div class="price-item">Hỗ trợ ưu tiên 24/7</div></div><a href="#" class="btn btn-ghost" style="width:100%;justify-content:center">Liên hệ tư vấn</a></div>
  </div>
</div></section>

<section class="cta"><div class="wrap"><div class="cta-inner">
  <h2>Đội nhóm của bạn xứng đáng được tốt hơn</h2>
  <p>Tham gia cùng hơn 50,000 nhóm đang dùng TeamPulse để làm việc hiệu quả hơn mỗi ngày.</p>
  <a href="#" class="btn-w">Bắt đầu miễn phí ngay →</a>
</div></div></section>

<footer><div class="wrap">
  <div class="foot-top">
    <div><div class="foot-logo"><div class="logo-dot">T</div>TeamPulse</div><p style="font-size:13px;line-height:1.7">Nền tảng quản lý dự án và cộng tác nhóm<br/>dành cho doanh nghiệp Việt Nam.</p></div>
    <div class="foot-col"><h5>Sản phẩm</h5><a href="#">Tính năng</a><a href="#">Bảng giá</a><a href="#">Changelog</a></div>
    <div class="foot-col"><h5>Tài nguyên</h5><a href="#">Tài liệu</a><a href="#">Blog</a><a href="#">Template</a></div>
    <div class="foot-col"><h5>Công ty</h5><a href="#">Về chúng tôi</a><a href="#">Tuyển dụng</a><a href="#">Liên hệ</a></div>
  </div>
  <div class="foot-bottom">© 2026 TeamPulse Technologies. All rights reserved.</div>
</div></footer>
</body></html>`,
  },

  // ─────────────────────────────────────────────────────────────────────────────

  {
    id: 'analytix',
    name: 'Analytix',
    description: 'Business analytics template with a dark aesthetic and vibrant gradient highlights.',
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Analytix</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#f1f5f9;background:#0f0f1a;line-height:1.6}
a{text-decoration:none;color:inherit}
.wrap{width:min(100% - 40px,1140px);margin:0 auto}
nav{position:sticky;top:0;z-index:50;background:rgba(15,15,26,.9);backdrop-filter:blur(16px);border-bottom:1px solid rgba(139,92,246,.15)}
.nav-i{display:flex;align-items:center;justify-content:space-between;height:62px}
.logo{font-size:19px;font-weight:800;display:flex;align-items:center;gap:10px;color:#fff}
.logo-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);display:grid;place-items:center;font-size:15px}
.nl{display:flex;gap:26px}.nl a{font-size:14px;font-weight:500;color:rgba(255,255,255,.6);transition:.2s}.nl a:hover{color:#a78bfa}
.btn{display:inline-flex;align-items:center;gap:8px;padding:9px 20px;border-radius:8px;font-weight:600;font-size:14px;border:none;cursor:pointer;transition:.2s}
.btn-v{background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff}.btn-v:hover{opacity:.9}
.btn-g{background:rgba(139,92,246,.12);color:#a78bfa;border:1px solid rgba(139,92,246,.25)}.btn-g:hover{background:rgba(139,92,246,.2)}
/* HERO */
.hero{padding:80px 0 64px;background:radial-gradient(ellipse at top,rgba(124,58,237,.2) 0%,transparent 55%)}
.hero-inner{text-align:center;max-width:780px;margin:0 auto}
.hero-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);color:#c4b5fd;padding:5px 14px;border-radius:99px;font-size:12px;font-weight:700;margin-bottom:24px;text-transform:uppercase;letter-spacing:.06em}
.hero h1{font-size:clamp(36px,5.5vw,64px);font-weight:800;line-height:1.08;letter-spacing:-.03em;margin-bottom:18px;color:#fff}
.hero h1 span{background:linear-gradient(90deg,#a78bfa,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{font-size:18px;color:rgba(255,255,255,.65);max-width:580px;margin:0 auto 32px}
.hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
/* DASHBOARD PREVIEW */
.preview{padding:0 0 80px}
.preview-wrap{background:rgba(255,255,255,.04);border:1px solid rgba(139,92,246,.2);border-radius:22px;padding:26px}
.prev-top{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.kpi{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px}
.kpi-label{font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.kpi-val{font-size:28px;font-weight:800;color:#fff;letter-spacing:-.02em}
.kpi-sub{font-size:12px;margin-top:4px}
.kpi-up{color:#34d399}.kpi-down{color:#f87171}
.prev-grid{display:grid;grid-template-columns:2fr 1fr;gap:14px}
.chart-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:18px}
.chart-title{font-size:13px;font-weight:600;color:rgba(255,255,255,.8);margin-bottom:16px}
.bar-chart{display:flex;align-items:flex-end;gap:8px;height:120px}
.b{flex:1;border-radius:6px 6px 0 0;opacity:.85;transition:.3s}
.b:hover{opacity:1}
.pie-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:18px}
.pie-legend{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.pie-item{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,.7)}
.pie-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
/* FEATURES */
.features{padding:80px 0}
.sec-h{text-align:center;margin-bottom:52px}
.sec-h h2{font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-.02em;margin-bottom:10px;color:#fff}
.sec-h p{color:rgba(255,255,255,.55);font-size:16px;max-width:520px;margin:0 auto}
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.feat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:28px;transition:.25s}
.feat-card:hover{border-color:rgba(139,92,246,.4);background:rgba(139,92,246,.08)}
.feat-icon{width:48px;height:48px;border-radius:14px;margin-bottom:16px;display:grid;place-items:center;font-size:22px}
.feat-card h3{font-size:16px;font-weight:700;color:#fff;margin-bottom:8px}
.feat-card p{color:rgba(255,255,255,.55);font-size:14px}
/* STEPS */
.steps{padding:80px 0;background:rgba(124,58,237,.06);border-top:1px solid rgba(139,92,246,.1);border-bottom:1px solid rgba(139,92,246,.1)}
.steps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:48px;position:relative}
.step{text-align:center;padding:0 12px}
.step-num{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;font-weight:800;font-size:18px;display:grid;place-items:center;margin:0 auto 16px}
.step h3{font-size:15px;font-weight:700;color:#fff;margin-bottom:8px}
.step p{font-size:13px;color:rgba(255,255,255,.55)}
/* CTA */
.cta{padding:80px 0}
.cta-box{background:linear-gradient(135deg,rgba(124,58,237,.3),rgba(6,182,212,.3));border:1px solid rgba(139,92,246,.3);border-radius:24px;padding:60px 44px;text-align:center;position:relative;overflow:hidden}
.cta-box::before{content:"";position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(124,58,237,.4),transparent 70%);top:-80px;right:-80px;border-radius:50%}
.cta-box h2{font-size:clamp(26px,4vw,44px);font-weight:800;letter-spacing:-.02em;margin-bottom:14px;color:#fff;position:relative;z-index:1}
.cta-box p{color:rgba(255,255,255,.7);font-size:16px;max-width:520px;margin:0 auto 30px;position:relative;z-index:1}
/* FOOTER */
footer{background:#08080f;padding:48px 0 20px;border-top:1px solid rgba(255,255,255,.06)}
.foot-g{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:28px;margin-bottom:28px}
.foot-brand p{font-size:13px;color:rgba(255,255,255,.45);margin-top:10px;line-height:1.7}
.foot-col h5{color:#fff;font-size:14px;font-weight:600;margin-bottom:12px}
.foot-col a{display:block;font-size:13px;color:rgba(255,255,255,.5);margin-bottom:7px;transition:.2s}.foot-col a:hover{color:#a78bfa}
.foot-b{border-top:1px solid rgba(255,255,255,.07);padding-top:18px;text-align:center;font-size:12px;color:rgba(255,255,255,.3)}
@media(max-width:768px){.prev-top,.prev-grid,.feat-grid,.steps-grid,.foot-g{grid-template-columns:1fr}.nl{display:none}}
</style>
</head>
<body>
<nav><div class="wrap"><div class="nav-i">
  <div class="logo"><div class="logo-icon">📊</div>Analytix</div>
  <div class="nl"><a href="#features">Tính năng</a><a href="#steps">Cách hoạt động</a><a href="#pricing">Bảng giá</a></div>
  <div style="display:flex;gap:10px">
    <a href="#" class="btn btn-g">Đăng nhập</a>
    <a href="#" class="btn btn-v">Dùng miễn phí</a>
  </div>
</div></div></nav>

<section class="hero"><div class="wrap"><div class="hero-inner">
  <div class="hero-chip">✦ AI-Powered Analytics</div>
  <h1>Biến dữ liệu thành<br/><span>lợi thế cạnh tranh</span></h1>
  <p>Analytix giúp doanh nghiệp thu thập, phân tích và trực quan hóa dữ liệu từ mọi nguồn — đưa ra quyết định chính xác hơn, nhanh hơn.</p>
  <div class="hero-btns">
    <a href="#" class="btn btn-v">Bắt đầu phân tích ngay</a>
    <a href="#features" class="btn btn-g">Xem tính năng</a>
  </div>
</div></div></section>

<section class="preview"><div class="wrap">
  <div class="preview-wrap">
    <div class="prev-top">
      <div class="kpi"><div class="kpi-label">Doanh thu tháng</div><div class="kpi-val">₫ 8.4B</div><div class="kpi-sub kpi-up">↑ 23% so với tháng trước</div></div>
      <div class="kpi"><div class="kpi-label">Khách hàng mới</div><div class="kpi-val">1,842</div><div class="kpi-sub kpi-up">↑ 18% so với tháng trước</div></div>
      <div class="kpi"><div class="kpi-label">Tỷ lệ chuyển đổi</div><div class="kpi-val">4.7%</div><div class="kpi-sub kpi-down">↓ 0.3% so với tháng trước</div></div>
      <div class="kpi"><div class="kpi-label">Chi phí / khách hàng</div><div class="kpi-val">₫ 142K</div><div class="kpi-sub kpi-up">↓ 11% tối ưu hơn</div></div>
    </div>
    <div class="prev-grid">
      <div class="chart-box">
        <div class="chart-title">📈 Doanh thu 6 tháng gần nhất (tỷ đồng)</div>
        <div class="bar-chart">
          <div class="b" style="height:45%;background:linear-gradient(180deg,#7c3aed,#4c1d95)"></div>
          <div class="b" style="height:60%;background:linear-gradient(180deg,#7c3aed,#4c1d95)"></div>
          <div class="b" style="height:52%;background:linear-gradient(180deg,#7c3aed,#4c1d95)"></div>
          <div class="b" style="height:78%;background:linear-gradient(180deg,#8b5cf6,#5b21b6)"></div>
          <div class="b" style="height:68%;background:linear-gradient(180deg,#7c3aed,#4c1d95)"></div>
          <div class="b" style="height:92%;background:linear-gradient(180deg,#06b6d4,#0284c7)"></div>
        </div>
      </div>
      <div class="pie-box">
        <div class="chart-title">🎯 Nguồn doanh thu</div>
        <div style="width:80px;height:80px;border-radius:50%;background:conic-gradient(#7c3aed 0% 45%,#06b6d4 45% 70%,#f59e0b 70% 85%,#34d399 85% 100%);margin:0 auto"></div>
        <div class="pie-legend">
          <div class="pie-item"><div class="pie-dot" style="background:#7c3aed"></div>Online Sales 45%</div>
          <div class="pie-item"><div class="pie-dot" style="background:#06b6d4"></div>Direct 25%</div>
          <div class="pie-item"><div class="pie-dot" style="background:#f59e0b"></div>Partner 15%</div>
          <div class="pie-item"><div class="pie-dot" style="background:#34d399"></div>Other 15%</div>
        </div>
      </div>
    </div>
  </div>
</div></section>

<section class="features" id="features"><div class="wrap">
  <div class="sec-h"><h2>Phân tích mọi khía cạnh kinh doanh</h2><p>Từ doanh thu đến hành vi khách hàng — Analytix cho bạn cái nhìn 360 độ.</p></div>
  <div class="feat-grid">
    <div class="feat-card"><div class="feat-icon" style="background:rgba(124,58,237,.2)">📊</div><h3>Real-time Dashboard</h3><p>Dữ liệu cập nhật theo thời gian thực. Theo dõi KPI quan trọng ngay khi chúng thay đổi.</p></div>
    <div class="feat-card"><div class="feat-icon" style="background:rgba(6,182,212,.15)">🤖</div><h3>AI Dự báo xu hướng</h3><p>Mô hình AI phân tích lịch sử, dự báo doanh thu và nhận diện rủi ro trước khi chúng xảy ra.</p></div>
    <div class="feat-card"><div class="feat-icon" style="background:rgba(245,158,11,.15)">🔗</div><h3>Tích hợp đa nguồn</h3><p>Kết nối CRM, ERP, Google Analytics, Facebook Ads và hơn 100 nguồn dữ liệu khác nhau.</p></div>
    <div class="feat-card"><div class="feat-icon" style="background:rgba(52,211,153,.15)">📋</div><h3>Báo cáo tự động</h3><p>Tạo báo cáo định kỳ, gửi email tự động cho stakeholders. Xuất PDF, Excel chỉ một click.</p></div>
    <div class="feat-card"><div class="feat-icon" style="background:rgba(248,113,113,.15)">👥</div><h3>Phân tích khách hàng</h3><p>Segmentation khách hàng, phân tích hành vi, dự đoán churn và tối ưu hóa lifetime value.</p></div>
    <div class="feat-card"><div class="feat-icon" style="background:rgba(139,92,246,.2)">🛡️</div><h3>Bảo mật cấp Enterprise</h3><p>Mã hóa end-to-end, audit log, phân quyền chi tiết và tuân thủ GDPR, ISO 27001.</p></div>
  </div>
</div></section>

<section class="steps" id="steps"><div class="wrap">
  <div class="sec-h"><h2>Bắt đầu trong 4 bước đơn giản</h2><p>Từ kết nối dữ liệu đến insight kinh doanh — chỉ mất vài phút.</p></div>
  <div class="steps-grid">
    <div class="step"><div class="step-num">1</div><h3>Kết nối nguồn dữ liệu</h3><p>Tích hợp với các hệ thống hiện có của bạn qua API hoặc connector có sẵn.</p></div>
    <div class="step"><div class="step-num">2</div><h3>Cấu hình Dashboard</h3><p>Chọn metrics quan trọng và xây dựng dashboard theo nhu cầu của từng phòng ban.</p></div>
    <div class="step"><div class="step-num">3</div><h3>AI phân tích tự động</h3><p>Hệ thống AI tự động phát hiện xu hướng, bất thường và cơ hội trong dữ liệu.</p></div>
    <div class="step"><div class="step-num">4</div><h3>Ra quyết định tốt hơn</h3><p>Nhận insights rõ ràng, có thể hành động được — giúp tăng trưởng doanh nghiệp bền vững.</p></div>
  </div>
</div></section>

<section class="cta"><div class="wrap"><div class="cta-box">
  <h2>Dữ liệu của bạn đang nói gì?</h2>
  <p>Hơn 3,000 doanh nghiệp đã khám phá ra những insight ẩn giấu trong dữ liệu của họ. Bắt đầu miễn phí hôm nay.</p>
  <a href="#" class="btn btn-v" style="position:relative;z-index:1">Phân tích miễn phí 30 ngày →</a>
</div></div></section>

<footer><div class="wrap">
  <div class="foot-g">
    <div class="foot-brand"><div class="logo"><div class="logo-icon">📊</div>Analytix</div><p>Nền tảng phân tích dữ liệu kinh doanh<br/>thông minh, dành cho doanh nghiệp hiện đại.</p></div>
    <div class="foot-col"><h5>Sản phẩm</h5><a href="#">Dashboard</a><a href="#">Báo cáo</a><a href="#">API</a><a href="#">Tích hợp</a></div>
    <div class="foot-col"><h5>Giải pháp</h5><a href="#">Marketing</a><a href="#">Bán hàng</a><a href="#">Vận hành</a><a href="#">Tài chính</a></div>
    <div class="foot-col"><h5>Công ty</h5><a href="#">Về Analytix</a><a href="#">Blog</a><a href="#">Tuyển dụng</a><a href="#">Liên hệ</a></div>
  </div>
  <div class="foot-b">© 2026 Analytix. Built for data-driven businesses.</div>
</div></footer>
</body></html>`,
  },
  {
    id: 'crmpro',
    name: 'CRMPro',
    description: 'Customer and sales management template with visual pipelines and deal tracking.',
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>CRMPro</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#111827;background:#fff;line-height:1.6}
a{text-decoration:none;color:inherit}
.wrap{width:min(100% - 40px,1160px);margin:0 auto}
nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #e5e7eb}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:60px}
.logo{font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}
.logo-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#059669,#10b981);display:grid;place-items:center;color:#fff;font-size:16px;font-weight:800}
.nav-links{display:flex;gap:28px}
.nav-links a{font-size:14px;font-weight:500;color:#6b7280;transition:.2s}
.nav-links a:hover{color:#059669}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:.2s}
.btn-g{background:linear-gradient(135deg,#059669,#0d9488);color:#fff}
.btn-g:hover{opacity:.9}
.btn-o{border:1.5px solid #059669;color:#059669;background:transparent}
.btn-o:hover{background:#ecfdf5}
.hero{padding:88px 0 64px;background:linear-gradient(180deg,#f0fdf4 0%,#fff 100%)}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:#ecfdf5;border:1px solid #a7f3d0;color:#059669;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;margin-bottom:20px}
.hero h1{font-size:clamp(34px,5vw,62px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:18px}
.hero h1 span{color:#059669}
.hero p{font-size:17px;color:#6b7280;max-width:580px;margin:0 auto 32px}
.hero-center{text-align:center}
.hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:56px}
.pipeline-demo{background:#fff;border-radius:16px;box-shadow:0 4px 40px rgba(5,150,105,.12);border:1px solid #d1fae5;padding:24px;max-width:780px;margin:0 auto}
.pipeline-title{font-size:13px;font-weight:700;color:#374151;margin-bottom:16px;display:flex;align-items:center;gap:6px}
.pipeline-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.pipe-col-head{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;padding:0 2px}
.pipe-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:6px}
.pipe-card-name{font-size:12px;font-weight:600;color:#111827;margin-bottom:4px}
.pipe-card-val{font-size:11px;color:#059669;font-weight:700}
.pipe-card-comp{font-size:11px;color:#9ca3af}
.pipe-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}
.stats{padding:52px 0;border-top:1px solid #f0fdf4;border-bottom:1px solid #f0fdf4}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.stat-n{font-size:38px;font-weight:800;color:#059669;letter-spacing:-.03em}
.stat-l{font-size:13px;color:#6b7280;margin-top:4px}
.features{padding:80px 0}
.sec-h{text-align:center;margin-bottom:52px}
.sec-h h2{font-size:clamp(26px,3.8vw,42px);font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
.sec-h p{color:#6b7280;font-size:16px;max-width:540px;margin:0 auto}
.feats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.feat-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;transition:.25s}
.feat-card:hover{box-shadow:0 8px 32px rgba(5,150,105,.1);border-color:#a7f3d0;transform:translateY(-3px)}
.feat-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);display:grid;place-items:center;font-size:20px;margin-bottom:16px}
.feat-card h3{font-size:16px;font-weight:700;margin-bottom:8px}
.feat-card p{color:#6b7280;font-size:14px;line-height:1.6}
.pricing{padding:80px 0;background:#f9fafb}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto}
.price-card{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:32px;text-align:center}
.price-card.popular{border-color:#059669;box-shadow:0 8px 40px rgba(5,150,105,.15);position:relative}
.pop-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#059669;color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:99px}
.price-name{font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.price-val{font-size:40px;font-weight:800;letter-spacing:-.03em;margin-bottom:4px}
.price-val span{font-size:16px;font-weight:500;color:#9ca3af}
.price-desc{font-size:13px;color:#9ca3af;margin-bottom:24px}
.price-feats{list-style:none;text-align:left;margin-bottom:28px}
.price-feats li{font-size:13px;color:#374151;padding:5px 0;display:flex;align-items:center;gap:8px}
.price-feats li::before{content:"✓";color:#059669;font-weight:700;font-size:13px}
.cta{padding:80px 0;background:linear-gradient(135deg,#059669,#0d9488)}
.cta-box{text-align:center;color:#fff}
.cta-box h2{font-size:clamp(26px,3.5vw,40px);font-weight:800;margin-bottom:12px}
.cta-box p{font-size:16px;opacity:.85;max-width:520px;margin:0 auto 28px}
.btn-w{background:#fff;color:#059669;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block}
footer{background:#111827;color:#9ca3af;padding:48px 0 24px}
.foot-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:32px}
.foot-brand .logo{color:#fff;font-size:18px;margin-bottom:12px}
.foot-brand p{font-size:13px;line-height:1.7}
.foot-col h5{color:#fff;font-size:13px;font-weight:700;margin-bottom:14px}
.foot-col a{display:block;font-size:13px;margin-bottom:8px;transition:.2s}
.foot-col a:hover{color:#fff}
.foot-b{border-top:1px solid #1f2937;padding-top:20px;font-size:12px;text-align:center}
</style>
</head>
<body>
<nav><div class="wrap"><div class="nav-inner">
  <div class="logo"><div class="logo-mark">C</div>CRMPro</div>
  <div class="nav-links"><a href="#">Tính năng</a><a href="#">Bảng giá</a><a href="#">Tích hợp</a><a href="#">Tài liệu</a></div>
  <div style="display:flex;gap:10px"><a href="#" class="btn btn-o" style="padding:8px 18px">Đăng nhập</a><a href="#" class="btn btn-g" style="padding:8px 18px">Dùng thử miễn phí</a></div>
</div></div></nav>

<section class="hero"><div class="wrap"><div class="hero-center">
  <div class="hero-tag">🚀 Nền tảng CRM số 1 cho doanh nghiệp Việt</div>
  <h1>Quản lý khách hàng<br/><span>thông minh hơn</span>, bán nhiều hơn</h1>
  <p>Theo dõi toàn bộ vòng đời khách hàng — từ lead đến hợp đồng — trong một nền tảng duy nhất. Tăng tỷ lệ chốt deal lên 3x.</p>
  <div class="hero-btns">
    <a href="#" class="btn btn-g">Bắt đầu miễn phí 14 ngày →</a>
    <a href="#" class="btn btn-o">Xem demo</a>
  </div>
  <div class="pipeline-demo">
    <div class="pipeline-title">📊 Sales Pipeline — Tháng 4/2026</div>
    <div class="pipeline-cols">
      <div><div class="pipe-col-head" style="color:#6b7280">Lead mới (8)</div>
        <div class="pipe-card"><div class="pipe-card-name">Công ty ABC</div><div class="pipe-card-val">120tr</div><div class="pipe-card-comp"><span class="pipe-dot" style="background:#059669"></span>Nguyễn Minh</div></div>
        <div class="pipe-card"><div class="pipe-card-name">Tech Solutions</div><div class="pipe-card-val">85tr</div><div class="pipe-card-comp"><span class="pipe-dot" style="background:#0d9488"></span>Trần Hoa</div></div>
      </div>
      <div><div class="pipe-col-head" style="color:#3b82f6">Đang tư vấn (5)</div>
        <div class="pipe-card"><div class="pipe-card-name">VinGroup Sub</div><div class="pipe-card-val">450tr</div><div class="pipe-card-comp"><span class="pipe-dot" style="background:#3b82f6"></span>Lê Tuấn</div></div>
        <div class="pipe-card"><div class="pipe-card-name">Startup XYZ</div><div class="pipe-card-val">200tr</div><div class="pipe-card-comp"><span class="pipe-dot" style="background:#3b82f6"></span>Phạm Nam</div></div>
      </div>
      <div><div class="pipe-col-head" style="color:#f59e0b">Chờ ký kết (3)</div>
        <div class="pipe-card"><div class="pipe-card-name">Công ty DEF</div><div class="pipe-card-val">320tr</div><div class="pipe-card-comp"><span class="pipe-dot" style="background:#f59e0b"></span>Vũ Lan</div></div>
      </div>
      <div><div class="pipe-col-head" style="color:#059669">Đã chốt (12)</div>
        <div class="pipe-card" style="border-color:#a7f3d0;background:#f0fdf4"><div class="pipe-card-name">MegaCorp Ltd</div><div class="pipe-card-val" style="color:#059669">900tr ✓</div><div class="pipe-card-comp"><span class="pipe-dot" style="background:#059669"></span>Đạt</div></div>
        <div class="pipe-card" style="border-color:#a7f3d0;background:#f0fdf4"><div class="pipe-card-name">GlobalTech</div><div class="pipe-card-val" style="color:#059669">560tr ✓</div><div class="pipe-card-comp"><span class="pipe-dot" style="background:#059669"></span>Đạt</div></div>
      </div>
    </div>
  </div>
</div></div></section>

<section class="stats"><div class="wrap"><div class="stats-grid">
  <div><div class="stat-n">+3x</div><div class="stat-l">Tỷ lệ chốt deal</div></div>
  <div><div class="stat-n">15,000+</div><div class="stat-l">Doanh nghiệp tin dùng</div></div>
  <div><div class="stat-n">98%</div><div class="stat-l">Khách hàng hài lòng</div></div>
  <div><div class="stat-n">2.4 tỷ</div><div class="stat-l">Doanh thu qua hệ thống</div></div>
</div></div></section>

<section class="features"><div class="wrap">
  <div class="sec-h"><h2>Mọi thứ bạn cần để <span style="color:#059669">bán hàng hiệu quả</span></h2><p>Từ quản lý contact đến tự động hóa bán hàng — tất cả trong một nơi.</p></div>
  <div class="feats-grid">
    <div class="feat-card"><div class="feat-icon">👥</div><h3>Quản lý Contact 360°</h3><p>Lưu trữ toàn bộ lịch sử giao tiếp, tài liệu, ghi chú. Xem hồ sơ khách hàng đầy đủ chỉ trong 1 click.</p></div>
    <div class="feat-card"><div class="feat-icon">📈</div><h3>Pipeline kéo-thả</h3><p>Quản lý deal trực quan theo từng giai đoạn bán hàng. Dự báo doanh thu tự động theo thời gian thực.</p></div>
    <div class="feat-card"><div class="feat-icon">🤖</div><h3>Tự động hóa bán hàng</h3><p>Gửi email follow-up tự động, nhắc nhở task, phân công lead — tiết kiệm 5 giờ mỗi ngày cho team sales.</p></div>
    <div class="feat-card"><div class="feat-icon">📧</div><h3>Email Marketing tích hợp</h3><p>Tạo chiến dịch email cá nhân hóa, theo dõi open rate & click rate trực tiếp trong CRM.</p></div>
    <div class="feat-card"><div class="feat-icon">📊</div><h3>Báo cáo & Phân tích</h3><p>Dashboard real-time với 50+ chỉ số bán hàng. Xuất báo cáo PDF/Excel chỉ với 1 click.</p></div>
    <div class="feat-card"><div class="feat-icon">🔗</div><h3>Tích hợp linh hoạt</h3><p>Kết nối với Zalo, Facebook, email, kế toán, ERP. Hơn 200 tích hợp có sẵn qua API mở.</p></div>
  </div>
</div></section>

<section class="pricing"><div class="wrap">
  <div class="sec-h"><h2>Bảng giá minh bạch</h2><p>Chọn gói phù hợp với quy mô doanh nghiệp. Không phí ẩn.</p></div>
  <div class="pricing-grid">
    <div class="price-card"><div class="price-name">Starter</div><div class="price-val">299k<span>/tháng</span></div><div class="price-desc">Cho team nhỏ dưới 5 người</div><ul class="price-feats"><li>500 contacts</li><li>Pipeline cơ bản</li><li>Email tích hợp</li><li>Báo cáo cơ bản</li></ul><a href="#" class="btn btn-o" style="width:100%;justify-content:center">Bắt đầu</a></div>
    <div class="price-card popular"><div class="pop-badge">PHỔ BIẾN NHẤT</div><div class="price-name">Professional</div><div class="price-val">799k<span>/tháng</span></div><div class="price-desc">Cho doanh nghiệp đang tăng trưởng</div><ul class="price-feats"><li>Không giới hạn contacts</li><li>Pipeline tùy chỉnh</li><li>Tự động hóa bán hàng</li><li>Tích hợp đầy đủ</li><li>Báo cáo nâng cao</li></ul><a href="#" class="btn btn-g" style="width:100%;justify-content:center">Dùng thử 14 ngày</a></div>
    <div class="price-card"><div class="price-name">Enterprise</div><div class="price-val">Liên hệ</div><div class="price-desc">Cho tập đoàn & hệ thống lớn</div><ul class="price-feats"><li>Tất cả tính năng Pro</li><li>SLA 99.9% uptime</li><li>Dedicated support</li><li>Triển khai on-premise</li><li>Custom workflow</li></ul><a href="#" class="btn btn-o" style="width:100%;justify-content:center">Liên hệ tư vấn</a></div>
  </div>
</div></section>

<section class="cta"><div class="wrap"><div class="cta-box">
  <h2>Sẵn sàng tăng trưởng doanh thu?</h2>
  <p>Hơn 15,000 doanh nghiệp Việt đã tăng doanh thu trung bình 47% sau 3 tháng dùng CRMPro.</p>
  <a href="#" class="btn-w">Dùng thử miễn phí 14 ngày →</a>
</div></div></section>

<footer><div class="wrap">
  <div class="foot-g">
    <div class="foot-brand"><div class="logo" style="color:#fff;font-size:18px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#059669,#10b981);display:grid;place-items:center;color:#fff;font-weight:800;font-size:12px">C</div>CRMPro</div><p>Nền tảng CRM dành cho doanh nghiệp Việt<br/>muốn bán hàng thông minh và tăng trưởng bền vững.</p></div>
    <div class="foot-col"><h5>Sản phẩm</h5><a href="#">CRM</a><a href="#">Pipeline</a><a href="#">Automation</a><a href="#">API</a></div>
    <div class="foot-col"><h5>Giải pháp</h5><a href="#">Bán lẻ</a><a href="#">B2B</a><a href="#">Bất động sản</a><a href="#">Giáo dục</a></div>
    <div class="foot-col"><h5>Hỗ trợ</h5><a href="#">Tài liệu</a><a href="#">Blog</a><a href="#">Liên hệ</a><a href="#">Tuyển dụng</a></div>
  </div>
  <div class="foot-b">© 2026 CRMPro. Phát triển bởi đội ngũ Việt Nam 🇻🇳</div>
</div></footer>
</body></html>`,
  },
  {
    id: 'hrhub',
    name: 'HRHub',
    description: 'Comprehensive HR template covering attendance, payroll, and leave management.',
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>HRHub</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#111827;background:#fff;line-height:1.6}
a{text-decoration:none;color:inherit}
.wrap{width:min(100% - 40px,1160px);margin:0 auto}
nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #e5e7eb}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:60px}
.logo{font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}
.logo-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f97316,#fb923c);display:grid;place-items:center;color:#fff;font-size:16px;font-weight:800}
.nav-links{display:flex;gap:28px}
.nav-links a{font-size:14px;font-weight:500;color:#6b7280}
.nav-links a:hover{color:#f97316}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:.2s}
.btn-o{background:linear-gradient(135deg,#f97316,#fb923c);color:#fff}
.btn-o:hover{opacity:.9}
.btn-s{border:1.5px solid #f97316;color:#f97316;background:transparent}
.btn-s:hover{background:#fff7ed}
.hero{padding:80px 0 60px;background:linear-gradient(180deg,#fff7ed 0%,#fff 100%)}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:#fff7ed;border:1px solid #fed7aa;color:#f97316;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;margin-bottom:20px}
.hero-center{text-align:center}
.hero h1{font-size:clamp(34px,5vw,60px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:16px}
.hero h1 span{color:#f97316}
.hero p{font-size:17px;color:#6b7280;max-width:580px;margin:0 auto 32px}
.hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:52px}
.hr-dashboard{background:#fff;border-radius:16px;box-shadow:0 4px 40px rgba(249,115,22,.12);border:1px solid #fed7aa;padding:24px;max-width:800px;margin:0 auto}
.hr-top{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.hr-stat{background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:12px;padding:16px;text-align:center}
.hr-stat-n{font-size:28px;font-weight:800;color:#f97316}
.hr-stat-l{font-size:11px;color:#9a3412;font-weight:600;margin-top:2px}
.hr-mid{display:grid;grid-template-columns:1.5fr 1fr;gap:14px}
.hr-table-wrap{background:#f9fafb;border-radius:10px;padding:14px}
.hr-table-title{font-size:12px;font-weight:700;color:#374151;margin-bottom:10px}
.hr-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e5e7eb;font-size:12px}
.hr-row:last-child{border-bottom:none}
.hr-name{font-weight:600;color:#111827}
.hr-dept{color:#9ca3af}
.hr-badge{padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}
.badge-on{background:#dcfce7;color:#166534}
.badge-off{background:#fee2e2;color:#991b1b}
.badge-leave{background:#fef3c7;color:#92400e}
.hr-leave-wrap{background:#f9fafb;border-radius:10px;padding:14px}
.leave-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px}
.leave-bar-bg{flex:1;height:6px;background:#e5e7eb;border-radius:3px}
.leave-bar{height:6px;border-radius:3px}
.stats{padding:52px 0;border-top:1px solid #fff7ed;border-bottom:1px solid #fff7ed}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.stat-n{font-size:38px;font-weight:800;color:#f97316;letter-spacing:-.03em}
.stat-l{font-size:13px;color:#6b7280;margin-top:4px}
.features{padding:80px 0}
.sec-h{text-align:center;margin-bottom:48px}
.sec-h h2{font-size:clamp(26px,3.8vw,42px);font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
.sec-h p{color:#6b7280;font-size:16px;max-width:540px;margin:0 auto}
.feats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.feat-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;transition:.25s}
.feat-card:hover{box-shadow:0 8px 32px rgba(249,115,22,.1);border-color:#fed7aa;transform:translateY(-3px)}
.feat-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#fff7ed,#ffedd5);display:grid;place-items:center;font-size:20px;margin-bottom:16px}
.feat-card h3{font-size:16px;font-weight:700;margin-bottom:8px}
.feat-card p{color:#6b7280;font-size:14px;line-height:1.6}
.process{padding:80px 0;background:#fafafa}
.process-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center}
.step-num{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fb923c);color:#fff;font-size:18px;font-weight:800;display:grid;place-items:center;margin:0 auto 14px}
.step-title{font-size:15px;font-weight:700;margin-bottom:8px}
.step-desc{font-size:13px;color:#6b7280;line-height:1.6}
.cta{padding:80px 0;background:linear-gradient(135deg,#f97316,#fb923c)}
.cta-box{text-align:center;color:#fff}
.cta-box h2{font-size:clamp(26px,3.5vw,40px);font-weight:800;margin-bottom:12px}
.cta-box p{font-size:16px;opacity:.85;max-width:520px;margin:0 auto 28px}
.btn-w{background:#fff;color:#f97316;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block}
footer{background:#111827;color:#9ca3af;padding:48px 0 24px}
.foot-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:32px}
.foot-col h5{color:#fff;font-size:13px;font-weight:700;margin-bottom:14px}
.foot-col a{display:block;font-size:13px;margin-bottom:8px}
.foot-col a:hover{color:#fff}
.foot-b{border-top:1px solid #1f2937;padding-top:20px;font-size:12px;text-align:center}
</style>
</head>
<body>
<nav><div class="wrap"><div class="nav-inner">
  <div class="logo"><div class="logo-mark">H</div>HRHub</div>
  <div class="nav-links"><a href="#">Tính năng</a><a href="#">Bảng giá</a><a href="#">Tích hợp</a><a href="#">Blog HR</a></div>
  <div style="display:flex;gap:10px"><a href="#" class="btn btn-s" style="padding:8px 18px">Đăng nhập</a><a href="#" class="btn btn-o" style="padding:8px 18px">Dùng thử ngay</a></div>
</div></div></nav>

<section class="hero"><div class="wrap"><div class="hero-center">
  <div class="hero-tag">🏆 Giải pháp HRM tin cậy cho 8,000+ doanh nghiệp</div>
  <h1>Quản lý nhân sự <span>toàn diện</span><br/>trên một nền tảng</h1>
  <p>Chấm công, tính lương, quản lý nghỉ phép, đánh giá hiệu suất — tự động hóa 80% công việc HR hằng ngày.</p>
  <div class="hero-btns">
    <a href="#" class="btn btn-o">Bắt đầu miễn phí →</a>
    <a href="#" class="btn btn-s">Xem demo 5 phút</a>
  </div>
  <div class="hr-dashboard">
    <div class="hr-top">
      <div class="hr-stat"><div class="hr-stat-n">248</div><div class="hr-stat-l">Tổng nhân viên</div></div>
      <div class="hr-stat"><div class="hr-stat-n">12</div><div class="hr-stat-l">Vắng mặt hôm nay</div></div>
      <div class="hr-stat"><div class="hr-stat-n">35</div><div class="hr-stat-l">Đơn nghỉ phép</div></div>
      <div class="hr-stat"><div class="hr-stat-n">4.8</div><div class="hr-stat-l">Điểm hài lòng</div></div>
    </div>
    <div class="hr-mid">
      <div class="hr-table-wrap">
        <div class="hr-table-title">👥 Nhân viên hôm nay</div>
        <div class="hr-row"><div><div class="hr-name">Nguyễn Minh Tuấn</div><div class="hr-dept">Marketing</div></div><span class="hr-badge badge-on">Đang làm</span></div>
        <div class="hr-row"><div><div class="hr-name">Trần Thị Hoa</div><div class="hr-dept">Kế toán</div></div><span class="hr-badge badge-on">Đang làm</span></div>
        <div class="hr-row"><div><div class="hr-name">Lê Văn Đức</div><div class="hr-dept">Sales</div></div><span class="hr-badge badge-leave">Nghỉ phép</span></div>
        <div class="hr-row"><div><div class="hr-name">Phạm Thu Nga</div><div class="hr-dept">Dev</div></div><span class="hr-badge badge-off">WFH</span></div>
      </div>
      <div class="hr-leave-wrap">
        <div class="hr-table-title">📅 Nghỉ phép theo phòng ban</div>
        <div class="leave-row"><span style="width:70px;color:#374151;font-weight:600">Sales</span><div class="leave-bar-bg"><div class="leave-bar" style="width:75%;background:#f97316"></div></div><span style="font-size:11px;color:#6b7280">75%</span></div>
        <div class="leave-row"><span style="width:70px;color:#374151;font-weight:600">Dev</span><div class="leave-bar-bg"><div class="leave-bar" style="width:40%;background:#3b82f6"></div></div><span style="font-size:11px;color:#6b7280">40%</span></div>
        <div class="leave-row"><span style="width:70px;color:#374151;font-weight:600">Marketing</span><div class="leave-bar-bg"><div class="leave-bar" style="width:60%;background:#8b5cf6"></div></div><span style="font-size:11px;color:#6b7280">60%</span></div>
        <div class="leave-row"><span style="width:70px;color:#374151;font-weight:600">Kế toán</span><div class="leave-bar-bg"><div class="leave-bar" style="width:25%;background:#059669"></div></div><span style="font-size:11px;color:#6b7280">25%</span></div>
      </div>
    </div>
  </div>
</div></div></section>

<section class="stats"><div class="wrap"><div class="stats-grid">
  <div><div class="stat-n">8,000+</div><div class="stat-l">Doanh nghiệp tin dùng</div></div>
  <div><div class="stat-n">80%</div><div class="stat-l">Tiết kiệm thời gian HR</div></div>
  <div><div class="stat-n">99.9%</div><div class="stat-l">Uptime đảm bảo</div></div>
  <div><div class="stat-n">500k+</div><div class="stat-l">Nhân viên được quản lý</div></div>
</div></div></section>

<section class="features"><div class="wrap">
  <div class="sec-h"><h2>Giải pháp <span style="color:#f97316">HR toàn diện</span> trong một nơi</h2><p>Từ tuyển dụng đến offboarding — mọi quy trình nhân sự được số hóa và tự động hóa.</p></div>
  <div class="feats-grid">
    <div class="feat-card"><div class="feat-icon">⏰</div><h3>Chấm công thông minh</h3><p>Chấm công bằng khuôn mặt, GPS, QR code. Tích hợp máy chấm công. Báo cáo tự động cuối tháng.</p></div>
    <div class="feat-card"><div class="feat-icon">💰</div><h3>Tính lương tự động</h3><p>Tự động tính lương, thưởng, bảo hiểm, thuế TNCN. Xuất bảng lương PDF và chuyển khoản hàng loạt.</p></div>
    <div class="feat-card"><div class="feat-icon">📝</div><h3>Quản lý nghỉ phép</h3><p>Đăng ký và duyệt nghỉ phép online. Theo dõi số ngày còn lại. Tích hợp lịch làm việc toàn công ty.</p></div>
    <div class="feat-card"><div class="feat-icon">🎯</div><h3>Đánh giá hiệu suất</h3><p>KPI, OKR, 360 độ — thiết lập mục tiêu và đánh giá định kỳ. Liên kết với chính sách tăng lương.</p></div>
    <div class="feat-card"><div class="feat-icon">🎓</div><h3>Đào tạo & Phát triển</h3><p>Quản lý chương trình đào tạo, theo dõi tiến độ học tập. Xây dựng lộ trình phát triển cá nhân.</p></div>
    <div class="feat-card"><div class="feat-icon">📱</div><h3>App nhân viên</h3><p>Nhân viên tự xem bảng lương, đăng ký nghỉ phép, check-in qua app mobile iOS & Android.</p></div>
  </div>
</div></section>

<section class="process"><div class="wrap">
  <div class="sec-h"><h2>Triển khai trong 4 bước đơn giản</h2></div>
  <div class="process-grid">
    <div><div class="step-num">1</div><div class="step-title">Nhập dữ liệu nhân viên</div><div class="step-desc">Import từ Excel hoặc kết nối hệ thống cũ chỉ trong vài phút.</div></div>
    <div><div class="step-num">2</div><div class="step-title">Cấu hình chính sách</div><div class="step-desc">Thiết lập ca làm, chính sách nghỉ phép, cơ cấu lương phù hợp.</div></div>
    <div><div class="step-num">3</div><div class="step-title">Mời nhân viên dùng app</div><div class="step-desc">Nhân viên nhận link kích hoạt và bắt đầu dùng ngay hôm nay.</div></div>
    <div><div class="step-num">4</div><div class="step-title">Tự động hóa toàn bộ</div><div class="step-desc">Hệ thống tự động xử lý chấm công, lương, báo cáo mỗi tháng.</div></div>
  </div>
</div></section>

<section class="cta"><div class="wrap"><div class="cta-box">
  <h2>Tiết kiệm 20 giờ/tháng cho phòng HR của bạn</h2>
  <p>Hơn 8,000 doanh nghiệp đã tự động hóa quy trình nhân sự với HRHub. Bắt đầu miễn phí ngay hôm nay.</p>
  <a href="#" class="btn-w">Dùng thử 30 ngày miễn phí →</a>
</div></div></section>

<footer><div class="wrap">
  <div class="foot-g">
    <div><div style="font-size:18px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;margin-bottom:12px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#f97316,#fb923c);display:grid;place-items:center;color:#fff;font-weight:800;font-size:12px">H</div>HRHub</div><p style="font-size:13px;line-height:1.7">Phần mềm quản lý nhân sự toàn diện<br/>dành cho doanh nghiệp Việt Nam.</p></div>
    <div class="foot-col"><h5>Sản phẩm</h5><a href="#">Chấm công</a><a href="#">Bảng lương</a><a href="#">Nghỉ phép</a><a href="#">KPI</a></div>
    <div class="foot-col"><h5>Ngành nghề</h5><a href="#">Sản xuất</a><a href="#">Bán lẻ</a><a href="#">Dịch vụ</a><a href="#">Xây dựng</a></div>
    <div class="foot-col"><h5>Hỗ trợ</h5><a href="#">Hướng dẫn</a><a href="#">Video</a><a href="#">Hotline</a><a href="#">Liên hệ</a></div>
  </div>
  <div class="foot-b">© 2026 HRHub. Giải pháp nhân sự số cho Việt Nam 🇻🇳</div>
</div></footer>
</body></html>`,
  },
  {
    id: 'financeops',
    name: 'FinanceOps',
    description: 'Business finance template for invoicing, budgeting, and reporting workflows.',
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>FinanceOps</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#111827;background:#fff;line-height:1.6}
a{text-decoration:none;color:inherit}
.wrap{width:min(100% - 40px,1160px);margin:0 auto}
nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #e5e7eb}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:60px}
.logo{font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}
.logo-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:grid;place-items:center;color:#fff;font-size:16px;font-weight:800}
.nav-links{display:flex;gap:28px}
.nav-links a{font-size:14px;font-weight:500;color:#6b7280}
.nav-links a:hover{color:#6366f1}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:.2s}
.btn-p{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}
.btn-p:hover{opacity:.9}
.btn-s{border:1.5px solid #6366f1;color:#6366f1;background:transparent}
.btn-s:hover{background:#eef2ff}
.hero{padding:80px 0 56px;background:linear-gradient(180deg,#eef2ff 0%,#fff 100%)}
.hero-center{text-align:center}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:#eef2ff;border:1px solid #c7d2fe;color:#6366f1;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;margin-bottom:20px}
.hero h1{font-size:clamp(34px,5vw,60px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:16px}
.hero h1 span{color:#6366f1}
.hero p{font-size:17px;color:#6b7280;max-width:580px;margin:0 auto 32px}
.hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:52px}
.fin-dashboard{background:#fff;border-radius:16px;box-shadow:0 4px 40px rgba(99,102,241,.12);border:1px solid #c7d2fe;padding:24px;max-width:800px;margin:0 auto}
.fin-top{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.fin-stat{border-radius:12px;padding:16px;text-align:center}
.fin-stat.income{background:linear-gradient(135deg,#f0fdf4,#dcfce7)}
.fin-stat.expense{background:linear-gradient(135deg,#fff1f2,#ffe4e6)}
.fin-stat.profit{background:linear-gradient(135deg,#eef2ff,#e0e7ff)}
.fin-stat.cash{background:linear-gradient(135deg,#fffbeb,#fef3c7)}
.fin-stat-n{font-size:22px;font-weight:800;letter-spacing:-.02em}
.fin-stat.income .fin-stat-n{color:#059669}
.fin-stat.expense .fin-stat-n{color:#e11d48}
.fin-stat.profit .fin-stat-n{color:#6366f1}
.fin-stat.cash .fin-stat-n{color:#d97706}
.fin-stat-l{font-size:11px;font-weight:600;color:#6b7280;margin-top:3px}
.fin-stat-chg{font-size:10px;margin-top:2px;font-weight:700}
.up{color:#059669}.dn{color:#e11d48}
.fin-mid{display:grid;grid-template-columns:1.4fr 1fr;gap:14px}
.fin-chart-wrap{background:#f9fafb;border-radius:10px;padding:14px}
.fin-chart-title{font-size:12px;font-weight:700;color:#374151;margin-bottom:10px}
.bar-group{display:flex;align-items:flex-end;gap:4px;height:80px;justify-content:space-between}
.bar-pair{display:flex;align-items:flex-end;gap:2px;flex:1}
.bar-i{flex:1;background:#6366f1;border-radius:3px 3px 0 0;opacity:.85}
.bar-e{flex:1;background:#e0e7ff;border-radius:3px 3px 0 0}
.bar-labels{display:flex;justify-content:space-between;margin-top:4px}
.bar-labels span{flex:1;text-align:center;font-size:9px;color:#9ca3af}
.fin-inv-wrap{background:#f9fafb;border-radius:10px;padding:14px}
.inv-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:11px}
.inv-row:last-child{border-bottom:none}
.inv-client{font-weight:600;color:#111827}
.inv-amount{font-weight:700;color:#6366f1}
.inv-badge{padding:2px 7px;border-radius:99px;font-size:10px;font-weight:700}
.paid{background:#dcfce7;color:#166534}
.pending{background:#fef3c7;color:#92400e}
.overdue{background:#fee2e2;color:#991b1b}
.stats{padding:52px 0;border-top:1px solid #eef2ff;border-bottom:1px solid #eef2ff}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.stat-n{font-size:38px;font-weight:800;color:#6366f1;letter-spacing:-.03em}
.stat-l{font-size:13px;color:#6b7280;margin-top:4px}
.features{padding:80px 0}
.sec-h{text-align:center;margin-bottom:48px}
.sec-h h2{font-size:clamp(26px,3.8vw,42px);font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
.sec-h p{color:#6b7280;font-size:16px;max-width:540px;margin:0 auto}
.feats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.feat-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;transition:.25s}
.feat-card:hover{box-shadow:0 8px 32px rgba(99,102,241,.1);border-color:#c7d2fe;transform:translateY(-3px)}
.feat-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);display:grid;place-items:center;font-size:20px;margin-bottom:16px}
.feat-card h3{font-size:16px;font-weight:700;margin-bottom:8px}
.feat-card p{color:#6b7280;font-size:14px;line-height:1.6}
.integrations{padding:64px 0;background:#fafafa}
.int-logos{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-top:32px}
.int-logo{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 20px;font-size:13px;font-weight:600;color:#374151;display:flex;align-items:center;gap:8px}
.cta{padding:80px 0;background:linear-gradient(135deg,#6366f1,#8b5cf6)}
.cta-box{text-align:center;color:#fff}
.cta-box h2{font-size:clamp(26px,3.5vw,40px);font-weight:800;margin-bottom:12px}
.cta-box p{font-size:16px;opacity:.85;max-width:520px;margin:0 auto 28px}
.btn-w{background:#fff;color:#6366f1;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block}
footer{background:#0f172a;color:#94a3b8;padding:48px 0 24px}
.foot-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:32px}
.foot-col h5{color:#fff;font-size:13px;font-weight:700;margin-bottom:14px}
.foot-col a{display:block;font-size:13px;margin-bottom:8px}
.foot-col a:hover{color:#fff}
.foot-b{border-top:1px solid #1e293b;padding-top:20px;font-size:12px;text-align:center}
</style>
</head>
<body>
<nav><div class="wrap"><div class="nav-inner">
  <div class="logo"><div class="logo-mark">F</div>FinanceOps</div>
  <div class="nav-links"><a href="#">Tính năng</a><a href="#">Báo cáo</a><a href="#">Tích hợp</a><a href="#">Bảng giá</a></div>
  <div style="display:flex;gap:10px"><a href="#" class="btn btn-s" style="padding:8px 18px">Đăng nhập</a><a href="#" class="btn btn-p" style="padding:8px 18px">Dùng thử miễn phí</a></div>
</div></div></nav>

<section class="hero"><div class="wrap"><div class="hero-center">
  <div class="hero-tag">💎 Nền tảng tài chính cho 5,000+ doanh nghiệp</div>
  <h1>Kiểm soát tài chính<br/><span>thông minh</span> — tăng trưởng bền vững</h1>
  <p>Quản lý hóa đơn, dòng tiền, ngân sách và báo cáo tài chính — tự động hóa toàn bộ quy trình kế toán của bạn.</p>
  <div class="hero-btns">
    <a href="#" class="btn btn-p">Bắt đầu miễn phí →</a>
    <a href="#" class="btn btn-s">Xem demo live</a>
  </div>
  <div class="fin-dashboard">
    <div class="fin-top">
      <div class="fin-stat income"><div class="fin-stat-n">4.2 tỷ</div><div class="fin-stat-l">Doanh thu T4</div><div class="fin-stat-chg up">↑ 18% so tháng trước</div></div>
      <div class="fin-stat expense"><div class="fin-stat-n">2.8 tỷ</div><div class="fin-stat-l">Chi phí T4</div><div class="fin-stat-chg dn">↑ 5% so tháng trước</div></div>
      <div class="fin-stat profit"><div class="fin-stat-n">1.4 tỷ</div><div class="fin-stat-l">Lợi nhuận ròng</div><div class="fin-stat-chg up">↑ 32% so tháng trước</div></div>
      <div class="fin-stat cash"><div class="fin-stat-n">6.7 tỷ</div><div class="fin-stat-l">Tiền mặt hiện có</div><div class="fin-stat-chg up">↑ Ổn định</div></div>
    </div>
    <div class="fin-mid">
      <div class="fin-chart-wrap">
        <div class="fin-chart-title">📊 Doanh thu vs Chi phí — 6 tháng gần nhất</div>
        <div class="bar-group">
          <div class="bar-pair"><div class="bar-i" style="height:55%"></div><div class="bar-e" style="height:65%"></div></div>
          <div class="bar-pair"><div class="bar-i" style="height:62%"></div><div class="bar-e" style="height:55%"></div></div>
          <div class="bar-pair"><div class="bar-i" style="height:70%"></div><div class="bar-e" style="height:60%"></div></div>
          <div class="bar-pair"><div class="bar-i" style="height:65%"></div><div class="bar-e" style="height:58%"></div></div>
          <div class="bar-pair"><div class="bar-i" style="height:78%"></div><div class="bar-e" style="height:62%"></div></div>
          <div class="bar-pair"><div class="bar-i" style="height:90%"></div><div class="bar-e" style="height:67%"></div></div>
        </div>
        <div class="bar-labels"><span>T11</span><span>T12</span><span>T1</span><span>T2</span><span>T3</span><span>T4</span></div>
        <div style="display:flex;gap:12px;margin-top:8px;font-size:10px"><span style="color:#6366f1;font-weight:600">■ Doanh thu</span><span style="color:#a5b4fc;font-weight:600">■ Chi phí</span></div>
      </div>
      <div class="fin-inv-wrap">
        <div class="fin-chart-title">🧾 Hóa đơn gần nhất</div>
        <div class="inv-row"><div><div class="inv-client">Công ty ABC</div><div style="font-size:10px;color:#9ca3af">12/04/2026</div></div><div><div class="inv-amount">45tr</div><span class="inv-badge paid">Đã TT</span></div></div>
        <div class="inv-row"><div><div class="inv-client">Tech Startup XYZ</div><div style="font-size:10px;color:#9ca3af">10/04/2026</div></div><div><div class="inv-amount">120tr</div><span class="inv-badge pending">Chờ TT</span></div></div>
        <div class="inv-row"><div><div class="inv-client">Mega Corp Ltd</div><div style="font-size:10px;color:#9ca3af">01/04/2026</div></div><div><div class="inv-amount">280tr</div><span class="inv-badge overdue">Quá hạn</span></div></div>
        <div class="inv-row"><div><div class="inv-client">Green Energy Co</div><div style="font-size:10px;color:#9ca3af">08/04/2026</div></div><div><div class="inv-amount">67tr</div><span class="inv-badge paid">Đã TT</span></div></div>
      </div>
    </div>
  </div>
</div></div></section>

<section class="stats"><div class="wrap"><div class="stats-grid">
  <div><div class="stat-n">5,000+</div><div class="stat-l">Doanh nghiệp sử dụng</div></div>
  <div><div class="stat-n">1.2 triệu</div><div class="stat-l">Hóa đơn xử lý/năm</div></div>
  <div><div class="stat-n">96%</div><div class="stat-l">Tiết kiệm thời gian kế toán</div></div>
  <div><div class="stat-n">ISO 27001</div><div class="stat-l">Bảo mật dữ liệu</div></div>
</div></div></section>

<section class="features"><div class="wrap">
  <div class="sec-h"><h2>Tất cả tính năng <span style="color:#6366f1">tài chính</span> bạn cần</h2><p>Từ kế toán cơ bản đến phân tích tài chính nâng cao — mọi thứ trong một nền tảng.</p></div>
  <div class="feats-grid">
    <div class="feat-card"><div class="feat-icon">🧾</div><h3>Hóa đơn điện tử</h3><p>Tạo, gửi và theo dõi hóa đơn tự động. Tích hợp cổng thanh toán. Nhắc nhở thanh toán đến hạn tự động.</p></div>
    <div class="feat-card"><div class="feat-icon">💸</div><h3>Quản lý dòng tiền</h3><p>Theo dõi thu chi theo thời gian thực. Dự báo dòng tiền 3-6 tháng tới. Cảnh báo sớm thiếu hụt vốn.</p></div>
    <div class="feat-card"><div class="feat-icon">📊</div><h3>Báo cáo tài chính</h3><p>Tự động tạo P&L, bảng cân đối kế toán, báo cáo dòng tiền chuẩn theo quy định Việt Nam.</p></div>
    <div class="feat-card"><div class="feat-icon">🎯</div><h3>Lập ngân sách & KPI</h3><p>Lập kế hoạch ngân sách theo phòng ban, dự án. So sánh thực tế vs kế hoạch tự động hằng tháng.</p></div>
    <div class="feat-card"><div class="feat-icon">🏦</div><h3>Đối soát ngân hàng</h3><p>Tự động đối soát giao dịch ngân hàng. Kết nối trực tiếp với 20+ ngân hàng Việt Nam.</p></div>
    <div class="feat-card"><div class="feat-icon">🤖</div><h3>AI Tư vấn tài chính</h3><p>AI phân tích xu hướng, phát hiện bất thường, đề xuất tối ưu chi phí và tăng lợi nhuận.</p></div>
  </div>
</div></section>

<section class="integrations"><div class="wrap">
  <div class="sec-h"><h2>Tích hợp với công cụ bạn đang dùng</h2><p>Kết nối liền mạch với hệ thống ngân hàng, kế toán và ERP.</p></div>
  <div class="int-logos">
    <div class="int-logo">🏦 Vietcombank</div>
    <div class="int-logo">🏦 Techcombank</div>
    <div class="int-logo">🏦 BIDV</div>
    <div class="int-logo">📊 MISA</div>
    <div class="int-logo">📋 Fast Accounting</div>
    <div class="int-logo">🛒 VNPAY</div>
    <div class="int-logo">💳 MoMo</div>
    <div class="int-logo">📦 SAP</div>
    <div class="int-logo">⚡ Odoo</div>
    <div class="int-logo">📁 Google Sheets</div>
  </div>
</div></section>

<section class="cta"><div class="wrap"><div class="cta-box">
  <h2>Kiểm soát tài chính ngay từ hôm nay</h2>
  <p>5,000+ doanh nghiệp đã tiết kiệm trung bình 15 giờ/tuần cho công việc kế toán. Bắt đầu miễn phí.</p>
  <a href="#" class="btn-w">Dùng thử miễn phí 30 ngày →</a>
</div></div></section>

<footer><div class="wrap">
  <div class="foot-g">
    <div><div style="font-size:18px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;margin-bottom:12px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:grid;place-items:center;color:#fff;font-weight:800;font-size:12px">F</div>FinanceOps</div><p style="font-size:13px;line-height:1.7;color:#94a3b8">Nền tảng quản lý tài chính thông minh<br/>dành cho doanh nghiệp Việt Nam hiện đại.</p></div>
    <div class="foot-col"><h5>Sản phẩm</h5><a href="#">Hóa đơn</a><a href="#">Kế toán</a><a href="#">Báo cáo</a><a href="#">API</a></div>
    <div class="foot-col"><h5>Giải pháp</h5><a href="#">SME</div><a href="#">Doanh nghiệp</a><a href="#">Kế toán dịch vụ</a><a href="#">Startup</a></div>
    <div class="foot-col"><h5>Công ty</h5><a href="#">Về chúng tôi</a><a href="#">Blog</a><a href="#">Tuyển dụng</a><a href="#">Liên hệ</a></div>
  </div>
  <div class="foot-b">© 2026 FinanceOps. Tài chính minh bạch — tăng trưởng bền vững 🇻🇳</div>
</div></footer>
</body></html>`,
  },
] as const;
