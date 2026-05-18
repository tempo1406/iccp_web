GIAI ĐOẠN 1: KHỞI TẠO (HR LÀM VIỆC)
1. Quản lý bảng lương tổng thể (Admin/HR Dashboard)
Hành động: Định kỳ hàng tháng, HR truy cập vào đây để hệ thống tự động tính toán lương dựa trên công thức (Formula) đã cài đặt.
Flow: HR kiểm tra các chỉ số tổng (Tổng quỹ lương, số nhân viên) -> Xem danh sách tất cả nhân viên và số tiền thực nhận (Net Pay) -> Nếu thấy ổn, HR nhấn "Confirm & Submit for Approval" để gửi bộ hồ sơ này lên cấp quản lý.
2. Chi tiết lương nhân viên (HR View)
Hành động: Trong quá trình kiểm tra ở bước 1, nếu thấy lương của một cá nhân có vấn đề (quá cao hoặc quá thấp), HR sẽ click vào nhân viên đó để mở màn hình này.
Flow: HR soi chi tiết các khoản cộng/trừ, phụ cấp, bảo hiểm của riêng nhân viên đó để tìm lỗi -> Chỉnh sửa dữ liệu đầu vào nếu cần -> Quay lại bảng tổng thể để gửi đi.
GIAI ĐOẠN 2: KIỂM DUYỆT (MANAGER/CFO LÀM VIỆC)
3. Payroll Approval Queue & Summary (Hàng đợi phê duyệt)
Hành động: Quản lý (Manager/CFO) nhận được thông báo có bảng lương mới cần duyệt.
Flow: Quản lý xem các "lô lương" (batches) đang chờ. Họ nhìn vào Summary để thấy ngay biến động ngân sách (ví dụ: tháng này tăng 5% so với tháng trước). Nếu số tiền tổng nằm trong tầm kiểm soát, họ nhấn "Review Details" để soi kỹ hơn.
4. Payroll Audit & Comparison View (Đối soát & So sánh)
Hành động: Đây là bước "soi lỗi" chuyên sâu của quản lý.
Flow: Hệ thống tự động đặt bảng lương Tháng này cạnh Tháng trước. Các dòng có sự thay đổi lớn (>10%) sẽ bị gắn cờ đỏ (!).
Trường hợp A: Nếu mọi thứ đúng, Quản lý nhấn "Approve" (Chuyển đến bước 5).
Trường hợp B: Nếu phát hiện sai sót (ví dụ: nhầm mức thưởng), Quản lý nhấn "Reject" (Chuyển đến bước 6).
GIAI ĐOẠN 3: XỬ LÝ KHI CÓ SAI SÓT (VÒNG LẶP TỪ CHỐI)
5. Payroll Rejection & Correction Flow (Màn hình từ chối của Quản lý)
Hành động: Quản lý thực hiện lệnh từ chối.
Flow: Một cửa sổ hiện lên yêu cầu Quản lý chọn Lý do từ chối và để lại lời nhắn (Comment) cho HR. Họ có thể đính kèm các dòng nhân viên bị lỗi vào yêu cầu chỉnh sửa này -> Nhấn "Send back to HR".
6. HR Correction & Resubmission Dashboard (Màn hình sửa lỗi của HR)
Hành động: HR nhận được thông báo bộ hồ sơ lương bị trả về.
Flow: HR mở màn hình này, thấy ngay các dòng bị Quản lý "gắn cờ" và lời nhắn của Quản lý. HR thực hiện chỉnh sửa trực tiếp các lỗi đó -> Sau khi sửa xong, nhấn "Resubmit" để gửi lại cho Quản lý (quay lại bước 3).
GIAI ĐOẠN 4: HOÀN TẤT & PHÁT LƯƠNG
7. E-Signature & Final Confirmation (Ký số xác nhận cuối cùng)
Hành động: Sau khi bảng lương đã được sửa và Quản lý đã đồng ý ở bước 4.
Flow: Một màn hình bảo mật hiện lên. Quản lý thực hiện xác thực (MFA/OTP) và ký tên điện tử (E-signature) trực tiếp trên màn hình -> Nhấn "Final Release".
TÓM TẮT LUỒNG DỮ LIỆU:
HR lập bảng lương (1, 2).
Quản lý xem tóm tắt và đối soát (3, 4).
Nếu có lỗi: Quản lý từ chối (5) $\rightarrow$ HR sửa lại và gửi lại (6) $\rightarrow$ Quay lại bước 3.
Nếu chuẩn: Quản lý ký tên đóng dấu điện tử (7) $\rightarrow$ KẾT THÚC (Phát lương).