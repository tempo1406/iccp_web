<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
:root{
  --primary:#2563eb;
  --primary-dark:#1d4ed8;
  --bg:#ffffff;
  --text-main:#0f172a;
  --text-muted:#64748b;
  --accent:#f8fafc;
  --radius:16px;
}
*{
  box-sizing:border-box;
  margin-top:0px;
  margin-right:0px;
  margin-bottom:0px;
  margin-left:0px;
  padding-top:0px;
  padding-right:0px;
  padding-bottom:0px;
  padding-left:0px;
}
body{
  font-family:Inter, sans-serif;
  color:rgb(15, 23, 42);
  line-height:1.6;
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgb(255, 255, 255);
}
.container{
  width:min(90%, 1200px);
  margin-top:0px;
  margin-right:auto;
  margin-bottom:0px;
  margin-left:auto;
}
nav{
  padding-top:20px;
  padding-right:0px;
  padding-bottom:20px;
  padding-left:0px;
  position:sticky;
  top:0px;
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgba(255, 255, 255, 0.8);
  backdrop-filter:blur(10px);
  z-index:100;
  border-bottom-width:1px;
  border-bottom-style:solid;
  border-bottom-color:rgb(226, 232, 240);
}
.nav-flex{
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.logo{
  font-family:"Plus Jakarta Sans", sans-serif;
  font-weight:800;
  font-size:24px;
  display:flex;
  align-items:center;
  row-gap:8px;
  column-gap:8px;
}
.logo-dot{
  width:12px;
  height:12px;
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgb(37, 99, 235);
  border-top-left-radius:50%;
  border-top-right-radius:50%;
  border-bottom-right-radius:50%;
  border-bottom-left-radius:50%;
}
.nav-links{
  display:flex;
  row-gap:30px;
  column-gap:30px;
  font-weight:600;
  font-size:14px;
}
.btn-cta{
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgb(37, 99, 235);
  color:white;
  padding-top:10px;
  padding-right:24px;
  padding-bottom:10px;
  padding-left:24px;
  border-top-left-radius:50px;
  border-top-right-radius:50px;
  border-bottom-right-radius:50px;
  border-bottom-left-radius:50px;
  font-weight:600;
  transition-behavior:normal;
  transition-duration:0.3s;
  transition-timing-function:ease;
  transition-delay:0s;
  transition-property:all;
}
.btn-cta:hover{
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgb(29, 78, 216);
  transform:translateY(-2px);
}
.hero{
  padding-top:100px;
  padding-right:0px;
  padding-bottom:100px;
  padding-left:0px;
  text-align:center;
  background-image:radial-gradient(circle at center top, rgb(239, 246, 255) 0%, rgb(255, 255, 255) 70%);
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:initial;
}
h1{
  font-family:"Plus Jakarta Sans", sans-serif;
  font-size:clamp(40px, 6vw, 72px);
  line-height:1.1;
  margin-bottom:24px;
  letter-spacing:-0.02em;
}
.hero p{
  font-size:20px;
  color:rgb(100, 116, 139);
  max-width:700px;
  margin-top:0px;
  margin-right:auto;
  margin-bottom:40px;
  margin-left:auto;
}
.stats{
  padding-top:60px;
  padding-right:0px;
  padding-bottom:60px;
  padding-left:0px;
  display:grid;
  grid-template-columns:repeat(4, 1fr);
  row-gap:40px;
  column-gap:40px;
  border-top-width:1px;
  border-top-style:solid;
  border-top-color:rgb(226, 232, 240);
  border-bottom-width:1px;
  border-bottom-style:solid;
  border-bottom-color:rgb(226, 232, 240);
}
.stat-item{
  text-align:center;
}
.stat-val{
  font-size:32px;
  font-weight:800;
  display:block;
}
.stat-label{
  color:rgb(100, 116, 139);
  font-size:14px;
}
.features{
  padding-top:100px;
  padding-right:0px;
  padding-bottom:100px;
  padding-left:0px;
}
.grid-3{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));
  row-gap:30px;
  column-gap:30px;
}
.card{
  padding-top:40px;
  padding-right:40px;
  padding-bottom:40px;
  padding-left:40px;
  border-top-left-radius:16px;
  border-top-right-radius:16px;
  border-bottom-right-radius:16px;
  border-bottom-left-radius:16px;
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgb(248, 250, 252);
  border-top-width:1px;
  border-right-width:1px;
  border-bottom-width:1px;
  border-left-width:1px;
  border-top-style:solid;
  border-right-style:solid;
  border-bottom-style:solid;
  border-left-style:solid;
  border-top-color:rgb(226, 232, 240);
  border-right-color:rgb(226, 232, 240);
  border-bottom-color:rgb(226, 232, 240);
  border-left-color:rgb(226, 232, 240);
  border-image-source:initial;
  border-image-slice:initial;
  border-image-width:initial;
  border-image-outset:initial;
  border-image-repeat:initial;
  transition-behavior:normal;
  transition-duration:0.3s;
  transition-timing-function:ease;
  transition-delay:0s;
  transition-property:all;
}
.card:hover{
  transform:translateY(-10px);
  border-top-color:rgb(37, 99, 235);
  border-right-color:rgb(37, 99, 235);
  border-bottom-color:rgb(37, 99, 235);
  border-left-color:rgb(37, 99, 235);
}
.card h3{
  margin-bottom:15px;
  font-size:20px;
}
.testimonials{
  padding-top:100px;
  padding-right:0px;
  padding-bottom:100px;
  padding-left:0px;
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgb(15, 23, 42);
  color:white;
}
.quote{
  font-size:24px;
  font-style:italic;
  margin-bottom:30px;
}
footer{
  padding-top:80px;
  padding-right:0px;
  padding-bottom:80px;
  padding-left:0px;
  background-image:initial;
  background-position-x:initial;
  background-position-y:initial;
  background-size:initial;
  background-repeat:initial;
  background-attachment:initial;
  background-origin:initial;
  background-clip:initial;
  background-color:rgb(2, 6, 23);
  color:rgb(148, 163, 184);
}
@media (max-width: 768px){
  .nav-links{
    display:none;
  }
  .stats{
    grid-template-columns:1fr 1fr;
  }
}</style>
</head>
<body><body>
  <nav>
    <div class="container nav-flex">
      <div class="logo">
        <div class="logo-dot">
        </div>TeamPulse</div>
        <div class="nav-links">
          <a href="#">Tính năng</a>
          <a href="#">Giải pháp</a>
          <a href="#">Bảng giá</a>
        </div>
        <a href="#" class="btn-cta">Đăng ký ngay</a>
      </div>
    </nav>
    <section class="hero">
      <div class="container">
        <h1>Quản lý dự án<br/>với sức mạnh dữ liệu</h1>
        <p>Tối ưu hóa quy trình, dự báo tiến độ và tăng hiệu suất đội nhóm lên 300% với nền tảng quản lý dự án thông minh nhất.</p>
        <div id="i5rbzf">
          <a href="#" class="btn-cta">Bắt đầu miễn phí</a>
          <a href="#" id="i80ndw">Xem demo</a>
        </div>
      </div>
    </section>
    <section class="stats container">
      <div class="stat-item">
        <span class="stat-val">50k+</span>
        <span class="stat-label">Đội nhóm tin dùng</span>
      </div>
      <div class="stat-item">
        <span class="stat-val">99.9%</span>
        <span class="stat-label">Thời gian hoạt động</span>
      </div>
      <div class="stat-item">
        <span class="stat-val">12M+</span>
        <span class="stat-label">Task hoàn thành</span>
      </div>
      <div class="stat-item">
        <span class="stat-val">4.9/5</span>
        <span class="stat-label">Đánh giá hài lòng</span>
      </div>
    </section>
    <section class="features container">
      <h2 id="ig93xl">Tính năng vượt trội</h2>
      <div class="grid-3">
        <div class="card">
          <h3>Dashboard thông minh</h3>
          <p>Trực quan hóa mọi dữ liệu dự án bằng biểu đồ thời gian thực, giúp bạn nắm bắt tiến độ chỉ trong 1 giây.</p>
        </div>
        <div class="card">
          <h3>Tự động hóa quy trình</h3>
          <p>Loại bỏ các công việc lặp lại bằng hệ thống workflow thông minh, tiết kiệm 10 giờ làm việc mỗi tuần.</p>
        </div>
        <div class="card">
          <h3>Phân tích hiệu suất</h3>
          <p>Báo cáo chi tiết về năng suất cá nhân và nhóm, hỗ trợ đưa ra quyết định dựa trên dữ liệu thực tế.</p>
        </div>
      </div>
    </section>
    <section class="testimonials">
      <div class="container">
        <div class="quote">"TeamPulse đã thay đổi hoàn toàn cách chúng tôi làm việc. Mọi thứ trở nên minh bạch, nhanh chóng và hiệu quả hơn bao giờ hết."</div>
        <div id="icatww">Nguyễn Văn A - CEO tại TechCorp</div>
      </div>
    </section>
    <section class="container" id="izlchz">
      <h2 id="icl6ho">Sẵn sàng bứt phá?</h2>
      <p id="i01hkw">Tham gia cùng hàng ngàn doanh nghiệp đang dẫn đầu thị trường.</p>
      <a href="#" class="btn-cta" id="iwuamb">Bắt đầu dùng thử miễn phí</a>
    </section>
    <footer>
      <div class="container">
        <div id="imaa4i">
          <div>
            <div class="logo" id="i2zfzk">
              <div class="logo-dot">
              </div>TeamPulse</div>
            </div>
            <div>
              <h5>Sản phẩm</h5>
              <br/>Tính năng<br/>Bảng giá</div>
              <div>
                <h5>Tài nguyên</h5>
                <br/>Blog<br/>Tài liệu</div>
                <div>
                  <h5>Công ty</h5>
                  <br/>Về chúng tôi<br/>Liên hệ</div>
                </div>
              </div>
            </footer>
          </body></body>
</html>
