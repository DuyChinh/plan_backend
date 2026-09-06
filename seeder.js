require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Decision = require('./models/Decision');

const MONGODB_URI = process.env.MONGODB_URI;

const rawTasks = [
  // Tuần 1: Setup + architecture (Phase 0)
  { week: 1, day: 'T2', title: 'Đọc lại requirement, chia module', phase: 0, phaseName: 'Setup & Architecture', durationMinutes: 30, durationHours: 0.5, order: 1 },
  { week: 1, day: 'T3', title: 'Vẽ ERD version đầu + xác định entity', phase: 0, phaseName: 'Setup & Architecture', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'ERD + danh sách module', order: 2 },
  { week: 1, day: 'T4', title: 'Chốt relationship và business constraints', phase: 0, phaseName: 'Setup & Architecture', durationMinutes: 30, durationHours: 0.5, order: 3 },
  { week: 1, day: 'T5', title: 'Setup Laravel + Vue 2 + PostgreSQL', phase: 0, phaseName: 'Setup & Architecture', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Project Laravel/Vue 2/PostgreSQL đã dựng', order: 4 },
  { week: 1, day: 'T6', title: 'Setup .env, cấu trúc source', phase: 0, phaseName: 'Setup & Architecture', durationMinutes: 30, durationHours: 0.5, order: 5 },
  { week: 1, day: 'T7', title: 'Docker Compose + kết nối Laravel/PostgreSQL', phase: 0, phaseName: 'Setup & Architecture', durationMinutes: 120, durationHours: 2.0, order: 6 },
  { week: 1, day: 'CN', title: 'Tạo migration/model cơ bản', phase: 0, phaseName: 'Setup & Architecture', durationMinutes: 120, durationHours: 2.0, order: 7 },

  // Tuần 2: Database + seed (Phase 1)
  { week: 2, day: 'T2', title: 'Location / Route migration', phase: 1, phaseName: 'Database & Core Models', durationMinutes: 30, durationHours: 0.5, order: 8 },
  { week: 2, day: 'T3', title: 'Route stop / pickup / dropoff', phase: 1, phaseName: 'Database & Core Models', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'DB route/location hoàn thành', order: 9 },
  { week: 2, day: 'T4', title: 'Bus / seat layout', phase: 1, phaseName: 'Database & Core Models', durationMinutes: 30, durationHours: 0.5, order: 10 },
  { week: 2, day: 'T5', title: 'Seat / trip / trip seat', phase: 1, phaseName: 'Database & Core Models', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'DB bus/trip/seat hoàn thành', order: 11 },
  { week: 2, day: 'T6', title: 'Index + FK + unique constraints', phase: 1, phaseName: 'Database & Core Models', durationMinutes: 30, durationHours: 0.5, order: 12 },
  { week: 2, day: 'T7', title: 'Booking / hold / payment / ticket schema', phase: 1, phaseName: 'Database & Core Models', durationMinutes: 120, durationHours: 2.0, order: 13 },
  { week: 2, day: 'CN', title: 'Seeder địa điểm, tuyến, xe, trip (10 locs, 6 routes, 8 buses, 3 layouts, 200+ trips)', phase: 1, phaseName: 'Database & Core Models', durationMinutes: 120, durationHours: 2.0, order: 14 },

  // Tuần 3: Tìm chuyến BE + FE (Phase 2)
  { week: 3, day: 'T2', title: 'Thiết kế search API', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 30, durationHours: 0.5, order: 15 },
  { week: 3, day: 'T3', title: 'API search theo from/to/date', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'API search theo from/to/date hoạt động', order: 16 },
  { week: 3, day: 'T4', title: 'Query số ghế trống', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 30, durationHours: 0.5, order: 17 },
  { week: 3, day: 'T5', title: 'API trả giờ đi/đến, giá, loại xe', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Search API trả đủ thông tin giờ/giá/loại xe', order: 18 },
  { week: 3, day: 'T6', title: 'Vue 2 search form', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 30, durationHours: 0.5, order: 19 },
  { week: 3, day: 'T7', title: 'Search result UI', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 120, durationHours: 2.0, order: 20 },
  { week: 3, day: 'CN', title: 'Connect FE ↔ API + loading/error (Demo HN -> Sapa -> Danh sách)', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 120, durationHours: 2.0, order: 21 },

  // Tuần 4: Filter / sort / Trip detail (Phase 2)
  { week: 4, day: 'T2', title: 'Filter theo giờ', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 30, durationHours: 0.5, order: 22 },
  { week: 4, day: 'T3', title: 'Filter loại xe + khoảng giá', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Filter module hoàn thành', order: 23 },
  { week: 4, day: 'T4', title: 'Sorting theo giá/giờ/ghế trống', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 30, durationHours: 0.5, order: 24 },
  { week: 4, day: 'T5', title: 'Trip detail API', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Trip detail API hoàn chỉnh', order: 25 },
  { week: 4, day: 'T6', title: 'Detail UI', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 30, durationHours: 0.5, order: 26 },
  { week: 4, day: 'T7', title: 'Pickup/dropoff, tiện ích, policy', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 120, durationHours: 2.0, order: 27 },
  { week: 4, day: 'CN', title: 'Validation + rule cutoff 60 phút', phase: 2, phaseName: 'Search & Trip Details', durationMinutes: 120, durationHours: 2.0, order: 28 },

  // Tuần 5: Seat Layout (Phase 3)
  { week: 5, day: 'T2', title: 'Thiết kế JSON/layout structure', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 30, durationHours: 0.5, order: 29 },
  { week: 5, day: 'T3', title: 'API seat layout', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'API seat layout', order: 30 },
  { week: 5, day: 'T4', title: 'Renderer base Vue 2', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 30, durationHours: 0.5, order: 31 },
  { week: 5, day: 'T5', title: 'Layout ghế 45', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Demo layout ghế ngồi 45 chỗ', order: 32 },
  { week: 5, day: 'T6', title: 'Refactor component', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 30, durationHours: 0.5, order: 33 },
  { week: 5, day: 'T7', title: 'Giường nằm 40 chỗ 2 tầng (A01-A20, B01-B20)', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 120, durationHours: 2.0, order: 34 },
  { week: 5, day: 'CN', title: 'Limousine 22 phòng 2-1', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 120, durationHours: 2.0, order: 35 },

  // Tuần 6: Seat state + pricing (Phase 3)
  { week: 6, day: 'T2', title: 'Define seat states (available, selected, held, sold, disabled)', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 30, durationHours: 0.5, order: 36 },
  { week: 6, day: 'T3', title: 'API trạng thái ghế', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'API trạng thái 5 loại ghế', order: 37 },
  { week: 6, day: 'T4', title: 'FE hiển thị 5 trạng thái', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 30, durationHours: 0.5, order: 38 },
  { week: 6, day: 'T5', title: 'Click chọn/bỏ chọn ghế', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Click chọn/bỏ chọn tương tác mượt mà', order: 39 },
  { week: 6, day: 'T6', title: 'Rule tối đa 5 ghế 1 lần đặt', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 30, durationHours: 0.5, order: 40 },
  { week: 6, day: 'T7', title: 'Pricing theo vị trí (tầng trên/dưới, hàng đầu/cuối)', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 120, durationHours: 2.0, order: 41 },
  { week: 6, day: 'CN', title: 'Tổng tiền cập nhật ngay + validation + polish UI', phase: 3, phaseName: 'Seat Map & Pricing', durationMinutes: 120, durationHours: 2.0, order: 42 },

  // Tuần 7: Seat Hold (Phase 4)
  { week: 7, day: 'T2', title: 'Thiết kế SeatHold lifecycle', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 30, durationHours: 0.5, order: 43 },
  { week: 7, day: 'T3', title: 'API tạo hold', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'API hold và transaction cơ bản', order: 44 },
  { week: 7, day: 'T4', title: 'Transaction database', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 30, durationHours: 0.5, order: 45 },
  { week: 7, day: 'T5', title: 'DB locking / atomic reservation', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Locking khi giữ ghế, 1 ghế chỉ 1 holder', order: 46 },
  { week: 7, day: 'T6', title: 'Xử lý expires_at (10 phút)', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 30, durationHours: 0.5, order: 47 },
  { week: 7, day: 'T7', title: 'Job tự release ghế khi hết hạn', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 120, durationHours: 2.0, order: 48 },
  { week: 7, day: 'CN', title: 'Countdown FE + expiry handling', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 120, durationHours: 2.0, order: 49 },

  // Tuần 8: Concurrency + realtime (Phase 4)
  { week: 8, day: 'T2', title: 'Viết test case 2 user tranh ghế mili-giây', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 30, durationHours: 0.5, order: 50 },
  { week: 8, day: 'T3', title: 'Automated concurrency test', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Test script 2 users tranh ghế', order: 51 },
  { week: 8, day: 'T4', title: 'Fix race condition', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 30, durationHours: 0.5, order: 52 },
  { week: 8, day: 'T5', title: 'Test 30 request / 1 seat', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: '30 reqs -> 1 success, 29 conflicts. DB: 1 seat 1 booking', order: 53 },
  { week: 8, day: 'T6', title: 'Thiết kế seat refresh', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 30, durationHours: 0.5, order: 54 },
  { week: 8, day: 'T7', title: 'Polling/realtime seat update', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 120, durationHours: 2.0, order: 55 },
  { week: 8, day: 'CN', title: 'Test 50 client scenarios', phase: 4, phaseName: 'Concurrency & Realtime', durationMinutes: 120, durationHours: 2.0, order: 56 },

  // Tuần 9: Booking flow (Phase 5)
  { week: 9, day: 'T2', title: 'Booking API design', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 57 },
  { week: 9, day: 'T3', title: 'Create booking API', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Booking API tạo đơn đặt vé', order: 58 },
  { week: 9, day: 'T4', title: 'Booker info validation (tên, SĐT, email)', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 59 },
  { week: 9, day: 'T5', title: 'Passenger từng ghế', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Nhập thông tin hành khách từng ghế', order: 60 },
  { week: 9, day: 'T6', title: 'Chọn điểm đón / điểm trả', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 61 },
  { week: 9, day: 'T7', title: 'Booking form Vue 2', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 120, durationHours: 2.0, order: 62 },
  { week: 9, day: 'CN', title: 'Confirmation page trước thanh toán', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 120, durationHours: 2.0, order: 63 },

  // Tuần 10: Payment (Phase 5)
  { week: 10, day: 'T2', title: 'Payment model/state', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 64 },
  { week: 10, day: 'T3', title: 'Create payment API', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'API tạo payment intent/url', order: 65 },
  { week: 10, day: 'T4', title: 'Integrate sandbox (VNPAY/MoMo/Stripe sandbox)', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 66 },
  { week: 10, day: 'T5', title: 'Payment callback', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Payment sandbox đã chạy end-to-end', order: 67 },
  { week: 10, day: 'T6', title: 'Payment success/fail handling', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 68 },
  { week: 10, day: 'T7', title: 'Idempotency callback', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 120, durationHours: 2.0, order: 69 },
  { week: 10, day: 'CN', title: 'Double-click payment protection', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 120, durationHours: 2.0, order: 70 },

  // Tuần 11: Các payment edge case (Phase 5)
  { week: 11, day: 'T2', title: 'Duplicate callback test', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 71 },
  { week: 11, day: 'T3', title: 'Callback 2 lần → 1 ticket', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Callback 2 lần chỉ sinh đúng 1 vé duy nhất', order: 72 },
  { week: 11, day: 'T4', title: 'Late callback design', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 73 },
  { week: 11, day: 'T5', title: 'Hold expired + seat sold handling', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Không sinh vé trùng, đưa vào diện hoàn tiền', order: 74 },
  { week: 11, day: 'T6', title: 'Mark refund-required logic', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 30, durationHours: 0.5, order: 75 },
  { week: 11, day: 'T7', title: 'Payment abandonment (khách bỏ dở giữa chừng)', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 120, durationHours: 2.0, order: 76 },
  { week: 11, day: 'CN', title: 'Integration tests toàn payment flow', phase: 5, phaseName: 'Booking & Payment', durationMinutes: 120, durationHours: 2.0, order: 77 },

  // Tuần 12: Ticket / QR / tra cứu / huỷ (Phase 6)
  { week: 12, day: 'T2', title: 'Ticket code generation (không đoán được bằng n+1)', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 30, durationHours: 0.5, order: 78 },
  { week: 12, day: 'T3', title: 'Sinh ticket khi payment success', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Sinh ticket code unguessable khi thanh toán thành công', order: 79 },
  { week: 12, day: 'T4', title: 'QR generation & email ticket', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 30, durationHours: 0.5, order: 80 },
  { week: 12, day: 'T5', title: 'Lookup ticket code + phone (không cần đăng nhập)', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Tra cứu vé công khai bằng mã vé + SĐT', order: 81 },
  { week: 12, day: 'T6', title: 'Cancel API logic', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 30, durationHours: 0.5, order: 82 },
  { week: 12, day: 'T7', title: 'Refund policy 100% (>24h), 70% (12-24h), 0% (<12h)', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 120, durationHours: 2.0, order: 83 },
  { week: 12, day: 'CN', title: 'Cancel UI + email xác nhận huỷ', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 120, durationHours: 2.0, order: 84 },

  // Tuần 13: Check-in + bán tại quầy (Phase 6)
  { week: 13, day: 'T2', title: 'Check-in schema & API design', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 30, durationHours: 0.5, order: 85 },
  { week: 13, day: 'T3', title: 'Check-in ticket code', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'API Check-in mã vé hoạt động', order: 86 },
  { week: 13, day: 'T4', title: 'Rule check-in once (vé đã check-in không check-in lại, không huỷ)', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 30, durationHours: 0.5, order: 87 },
  { week: 13, day: 'T5', title: 'QR check-in scanner UI/API', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'QR check-in & xem danh sách khách chuyến', order: 88 },
  { week: 13, day: 'T6', title: 'Passenger list export (xuất file danh sách khách)', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 30, durationHours: 0.5, order: 89 },
  { week: 13, day: 'T7', title: 'Counter ticket sales (bán tại quầy thu tiền mặt)', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 120, durationHours: 2.0, order: 90 },
  { week: 13, day: 'CN', title: 'Hai nhân viên bán ghế cuối concurrency test', phase: 6, phaseName: 'Ticket, Cancellation & Check-in', durationMinutes: 120, durationHours: 2.0, order: 91 },

  // Tuần 14: Admin (Phase 7)
  { week: 14, day: 'T2', title: 'Admin layout / navigation', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 30, durationHours: 0.5, order: 92 },
  { week: 14, day: 'T3', title: 'CRUD location & routes', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'CRUD địa điểm & tuyến xe', order: 93 },
  { week: 14, day: 'T4', title: 'CRUD buses (danh sách xe)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 30, durationHours: 0.5, order: 94 },
  { week: 14, day: 'T5', title: 'CRUD seat layouts', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'CRUD sơ đồ ghế mẫu', order: 95 },
  { week: 14, day: 'T6', title: 'Trip CRUD (tạo chuyến lẻ)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 30, durationHours: 0.5, order: 96 },
  { week: 14, day: 'T7', title: 'Tạo trip hàng loạt theo lịch lặp (recurring trips)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 120, durationHours: 2.0, order: 97 },
  { week: 14, day: 'CN', title: 'Check bus schedule overlap (không xếp 1 xe 2 chuyến trùng giờ)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 120, durationHours: 2.0, order: 98 },

  // Tuần 15: Report / Audit / Security / Performance (Phase 7)
  { week: 15, day: 'T2', title: 'Revenue query (theo ngày/tuyến/chuyến)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 30, durationHours: 0.5, order: 99 },
  { week: 15, day: 'T3', title: 'Revenue dashboard UI', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Dashboard doanh thu & biểu đồ', order: 100 },
  { week: 15, day: 'T4', title: 'Occupancy / cancelled tickets report', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 30, durationHours: 0.5, order: 101 },
  { week: 15, day: 'T5', title: 'Audit log (ai huỷ vé nào, lúc nào, lý do)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Hệ thống Audit log hoạt động đầy đủ', order: 102 },
  { week: 15, day: 'T6', title: 'Rate limit API', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 30, durationHours: 0.5, order: 103 },
  { week: 15, day: 'T7', title: 'Security / API privacy review (không lộ PII)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 120, durationHours: 2.0, order: 104 },
  { week: 15, day: 'CN', title: 'Index / query optimization + benchmark (Search < 500ms, Seat < 300ms)', phase: 7, phaseName: 'Admin & Operations', durationMinutes: 120, durationHours: 2.0, order: 105 },

  // Tuần 16: Hoàn thiện (Phase 8)
  { week: 16, day: 'T2', title: 'Tổng hợp bug & issue list', phase: 8, phaseName: 'Testing & Documentation', durationMinutes: 30, durationHours: 0.5, order: 106 },
  { week: 16, day: 'T3', title: 'Fix các bug quan trọng', phase: 8, phaseName: 'Testing & Documentation', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Fix toàn bộ blocker/critical bugs', order: 107 },
  { week: 16, day: 'T4', title: 'Kiểm tra responsive mobile 375px', phase: 8, phaseName: 'Testing & Documentation', durationMinutes: 30, durationHours: 0.5, order: 108 },
  { week: 16, day: 'T5', title: 'Hoàn thiện API documentation', phase: 8, phaseName: 'Testing & Documentation', durationMinutes: 60, durationHours: 1.0, isMilestone: true, milestoneGoal: 'Tài liệu API hoàn chỉnh & chuẩn bị bàn giao', order: 109 },
  { week: 16, day: 'T6', title: 'README / setup guide cho Docker & local', phase: 8, phaseName: 'Testing & Documentation', durationMinutes: 30, durationHours: 0.5, order: 110 },
  { week: 16, day: 'T7', title: 'Integration / regression test toàn hệ thống', phase: 8, phaseName: 'Testing & Documentation', durationMinutes: 120, durationHours: 2.0, order: 111 },
  { week: 16, day: 'CN', title: 'Clean code + chuẩn bị kịch bản demo', phase: 8, phaseName: 'Testing & Documentation', durationMinutes: 120, durationHours: 2.0, order: 112 }
];

const initialDecisions = [
  {
    questionKey: 'change_bus_after_sold',
    title: 'Đổi xe của chuyến sau khi đã bán 10 vé, xe mới có sơ đồ ghế khác xử lý ra sao?',
    description: 'Case 7: Chuyến xe đã bán 10 vé nhưng vì lý do đột xuất xe bị hỏng hoặc đổi loại xe khác cấu hình.',
    options: [
      'Phương án A: Tự động map ghế tương đương theo vị trí, gửi SMS/Email thông báo vị trí ghế mới cho khách',
      'Phương án B: Khoá chuyến, huỷ vé hoàn tiền 100% kèm voucher giảm giá 20% cho chuyến sau',
      'Phương án C: Giữ nguyên đặt chỗ, nhân viên tổng đài chủ động gọi khách để xếp lại chỗ bằng tay trên sơ đồ mới'
    ],
    selectedOption: '',
    leaderNote: '',
    isDecided: false
  },
  {
    questionKey: 'hold_seat_scope',
    title: 'Giữ chỗ tính theo tài khoản, session hay thiết bị?',
    description: 'Xác định định danh để giữ chỗ 10 phút chống giữ chỗ ảo.',
    options: [
      'Phương án A: Session ID / Cookie (Khách không cần đăng nhập vẫn đặt được, hết 10p tự nhả)',
      'Phương án B: Bắt buộc đăng nhập tài khoản trước khi chọn ghế',
      'Phương án C: Session kết hợp Fingerprint thiết bị và Rate Limit theo IP'
    ],
    selectedOption: '',
    leaderNote: '',
    isDecided: false
  },
  {
    questionKey: 'guest_cancel_ticket',
    title: 'Khách vãng lai có được huỷ vé online không, hay phải gọi tổng đài?',
    description: 'Khách đặt vé không có tài khoản (chỉ có mã vé + SĐT).',
    options: [
      'Phương án A: Cho phép huỷ online sau khi nhập đúng Mã vé + SĐT + OTP xác thực gửi về SMS/Email',
      'Phương án B: Chỉ cho phép tra cứu online, muốn huỷ phải gọi tổng đài đối soát',
      'Phương án C: Cho phép huỷ trực tiếp trên web bằng Mã vé + SĐT nếu còn trên 24h trước giờ chạy'
    ],
    selectedOption: '',
    leaderNote: '',
    isDecided: false
  },
  {
    questionKey: 'refund_mechanism',
    title: 'Hoàn tiền là tự động qua cổng thanh toán hay ghi nhận rồi xử lý tay?',
    description: 'Khi khách huỷ vé hợp lệ (100% hoặc 70%) hoặc thanh toán trúng case late-callback.',
    options: [
      'Phương án A: Gọi API Refund tự động của cổng thanh toán (VNPAY/MoMo sandbox)',
      'Phương án B: Tạo bản ghi "Yêu cầu hoàn tiền" vào danh sách chờ duyệt của kế toán/admin để chuyển khoản thủ công',
      'Phương án C: Tự động hoàn đối với thẻ/ví điện tử, thủ công đối với chuyển khoản ngân hàng'
    ],
    selectedOption: '',
    leaderNote: '',
    isDecided: false
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Check existing tasks
    const count = await Task.countDocuments();
    if (count > 0) {
      console.log(`Already have ${count} tasks. Overwriting to ensure clean 16-week state...`);
      await Task.deleteMany({});
    }

    console.log(`Inserting ${rawTasks.length} tasks for 16 weeks...`);
    await Task.insertMany(rawTasks);
    console.log('Tasks inserted successfully!');

    // Seed Decisions
    for (const dec of initialDecisions) {
      await Decision.findOneAndUpdate(
        { questionKey: dec.questionKey },
        { $setOnInsert: dec },
        { upsert: true, new: true }
      );
    }
    console.log('Initial decisions seeded successfully!');

    console.log('Seeder completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeder failed:', err);
    process.exit(1);
  }
}

seed();
