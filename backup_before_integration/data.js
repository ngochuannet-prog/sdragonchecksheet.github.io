/**
 * SDragon AssetTracker Pro - Data Management & LocalStorage Layer
 * Holds demo industrial machinery data, maintenance logs, and storage utilities.
 */

const STORAGE_KEYS = {
  ASSETS: 'sdragon_machinery_assets_v3',
  LOGS: 'sdragon_maintenance_logs_v3',
  INSPECTIONS: 'sdragon_track_inspections_v3',
  THEME: 'sdragon_theme_pref'
};

// 10 HẠNG MỤC KIỂM TRA TIÊU CHUẨN TRACK SHEET VẬN HÀNH NHÀ MÁY
const STANDARD_INSPECTION_ITEMS = [
  {
    id: 1,
    name: 'Điện áp nguồn cung cấp (Voltage)',
    standard: '380V ± 10% (342V - 418V 3 pha) hoặc 220V ổn định, không sụt áp',
    method: 'Đồng hồ Vôn kế / Bộ đo nguồn tủ điện',
    defaultVal: '382V',
    unit: 'V'
  },
  {
    id: 2,
    name: 'Áp suất khí nén cấp vào hệ thống (Air Pressure)',
    standard: '0.50 - 0.70 MPa (5.0 - 7.0 bar), kim đồng hồ áp ổn định',
    method: 'Đồng hồ áp suất tại cụm FRL đầu vào',
    defaultVal: '6.2 bar',
    unit: 'bar'
  },
  {
    id: 3,
    name: 'Mức & Chất lượng dầu bôi trơn / Dầu thủy lực',
    standard: 'Nằm giữa vạch MIN và MAX mắt thăm, dầu sạch, không bọt cặn',
    method: 'Quan sát mắt thăm dầu ray & bình dầu',
    defaultVal: 'Mức 85% MAX (Dầu sạch)',
    unit: ''
  },
  {
    id: 4,
    name: 'Nhiệt độ động cơ, Trục chính (Spindle) & Bộ nguồn',
    standard: 'Nhiệt độ vỏ motor & spindle < 65°C, chiller tản nhiệt tốt',
    method: 'Súng bắn nhiệt hồng ngoại / Cảm biến',
    defaultVal: '46°C',
    unit: '°C'
  },
  {
    id: 5,
    name: 'Độ rung động & Tiếng ồn vận hành bất thường',
    standard: 'Máy chạy êm ái, không rung lắc, không có tiếng gõ rít cơ khí lạ',
    method: 'Lắng nghe âm thanh & cảm nhận độ rung thân bệ',
    defaultVal: 'Chạy êm, ổn định',
    unit: ''
  },
  {
    id: 6,
    name: 'Nút dừng khẩn cấp (E-Stop) & Cảm biến an toàn',
    standard: 'Nhấn E-Stop máy ngắt lực tức thì (<0.1s); rèm quang nhạy tốt',
    method: 'Bấm thử nút E-Stop & che thử quang điện',
    defaultVal: 'Tác động tức thì (<0.1s)',
    unit: ''
  },
  {
    id: 7,
    name: 'Kiểm tra rò rỉ (Khí nén, Dầu thủy lực, Nước làm mát)',
    standard: 'Không xì khí tại cút nối van, không rỉ dầu xylanh, không nhỏ giọt nước',
    method: 'Quan sát cụm van, ống dẫn & khay đáy',
    defaultVal: 'Kín hoàn toàn, khô ráo',
    unit: ''
  },
  {
    id: 8,
    name: 'Quạt làm mát & Lưới lọc bụi tủ điện điều khiển',
    standard: 'Quạt hút/thổi thổi mạnh, màng lọc bụi sạch, nhiệt độ tủ < 35°C',
    method: 'Kiểm tra luồng gió & tấm lưới lọc khí',
    defaultVal: 'Quạt quay mạnh, lưới sạch',
    unit: ''
  },
  {
    id: 9,
    name: 'Dây tiếp địa vỏ máy chống giật & Hệ thống cáp điện',
    standard: 'Dây nối đất siết chặt, điện trở < 4Ω, cáp không trầy xước nứt vỏ',
    method: 'Kiểm tra siết ốc tiếp địa & mắt thường',
    defaultVal: 'Tiếp địa chắc, cáp an toàn',
    unit: ''
  },
  {
    id: 10,
    name: 'Đèn tháp trạng thái (Tower Light) & Còi báo động',
    standard: 'Đèn Xanh (Run), Vàng (Wait), Đỏ (Alarm) sáng đúng; còi kêu rõ',
    method: 'Test đèn/còi trên bảng điều khiển / HMI',
    defaultVal: 'Đèn/còi hoạt động chuẩn',
    unit: ''
  }
];

// Realistic Industrial Machinery Seed Dataset
const DEMO_ASSETS = [
  {
    id: 'ast-001',
    code: 'EQ-CNC-001',
    name: 'Máy Phay CNC 5 Trục Mazak Variaxis',
    category: 'Máy Phay / Tiện CNC',
    department: 'Xưởng Cơ Khí A',
    location: 'Line Phay 1 - Trạm 01',
    status: 'operational',
    manufacturer: 'Yamazaki Mazak (Nhật Bản)',
    model: 'Variaxis i-700 / SN: 2023-MZ901',
    operator: 'Nguyễn Văn Hùng (0982.112.334)',
    commissionDate: '2023-03-15',
    maintenanceInterval: 90,
    lastMaintenance: '2026-09-10',
    nextDue: '2026-12-09',
    value: 3850000000,
    operatingHours: 4820,
    specs: 'Hành trình X/Y/Z: 730x850x560mm, Trục chính 18.000 RPM, Đài dao 40 vị trí HSK-A63, CNC SmoothX',
    lastCheckSheet: {
      date: '2026-10-30',
      time: '08:15',
      shift: 'Ca 1 (06:00 - 14:00)',
      inspector: 'Nguyễn Văn Hùng',
      status: 'PASS',
      passedCount: 10,
      totalCount: 10,
      summary: '10/10 ĐẠT'
    }
  },
  {
    id: 'ast-002',
    code: 'EQ-CNC-002',
    name: 'Máy Tiện CNC Đa Trục Doosan Puma',
    category: 'Máy Phay / Tiện CNC',
    department: 'Xưởng Cơ Khí A',
    location: 'Line Tiện 2 - Trạm 03',
    status: 'operational',
    manufacturer: 'DN Solutions (Hàn Quốc)',
    model: 'Puma GT2600 / SN: 2022-DN442',
    operator: 'Trần Đình Trọng (0973.554.211)',
    commissionDate: '2022-08-20',
    maintenanceInterval: 60,
    lastMaintenance: '2026-09-01',
    nextDue: '2026-10-31', // Sắp đến hạn ngày mai
    value: 1950000000,
    operatingHours: 6150,
    specs: 'Đường kính tiện Max: 460mm, Chiều dài tiện: 658mm, Chấu kẹp thủy lực 10 inch, Fanuc i-Plus',
    lastCheckSheet: {
      date: '2026-10-30',
      time: '08:30',
      shift: 'Ca 1 (06:00 - 14:00)',
      inspector: 'Trần Đình Trọng',
      status: 'PASS',
      passedCount: 10,
      totalCount: 10,
      summary: '10/10 ĐẠT'
    }
  },
  {
    id: 'ast-003',
    code: 'EQ-ROBOT-001',
    name: 'Cánh Tay Robot Hàn Tự Động Fanuc Arc',
    category: 'Cánh Tay Robot Công Nghiệp',
    department: 'Xưởng Lắp Ráp & Đóng Gói D',
    location: 'Line Hàn Khung - Trạm R1',
    status: 'operational',
    manufacturer: 'Fanuc Robotics (Nhật Bản)',
    model: 'ARC Mate 100iD / SN: F-99321',
    operator: 'Lê Minh Tuấn (0915.667.889)',
    commissionDate: '2023-01-10',
    maintenanceInterval: 90,
    lastMaintenance: '2026-08-15',
    nextDue: '2026-11-13',
    value: 1250000000,
    operatingHours: 5200,
    specs: 'Bán kính với 1441mm, Tải trọng 12kg, Độ lặp lại ±0.02mm, Tích hợp mỏ hàn Fronius TPS/i'
  },
  {
    id: 'ast-004',
    code: 'EQ-ROBOT-002',
    name: 'Cánh Tay Robot Bốc Xếp Phôi ABB IRB',
    category: 'Cánh Tay Robot Công Nghiệp',
    department: 'Xưởng Cơ Khí A',
    location: 'Cấp phôi máy CNC 01',
    status: 'down',
    manufacturer: 'ABB Robotics (Thụy Sĩ)',
    model: 'IRB 2600-20 / SN: ABB-7721',
    operator: 'Nguyễn Văn Hùng (0982.112.334)',
    commissionDate: '2023-05-12',
    maintenanceInterval: 90,
    lastMaintenance: '2026-07-20',
    nextDue: '2026-10-18', // Quá hạn
    value: 1450000000,
    operatingHours: 4980,
    specs: 'Tải trọng 20kg, Tầm vươn 1.65m, Cảnh báo kẹt trục số 3 (Joint 3 Axis Servo Error)',
    lastCheckSheet: {
      date: '2026-10-30',
      time: '07:45',
      shift: 'Ca 1 (06:00 - 14:00)',
      inspector: 'Nguyễn Văn Hùng',
      status: 'FAIL',
      passedCount: 8,
      totalCount: 10,
      summary: '2 MỤC NG (Rung động & Cáp)'
    }
  },
  {
    id: 'ast-005',
    code: 'EQ-INJ-001',
    name: 'Máy Ép Nhựa Thủy Lực Nissei 280T',
    category: 'Máy Ép Nhựa Thủy Lực',
    department: 'Xưởng Đúc Ép B',
    location: 'Line Ép Vỏ - Máy E1',
    status: 'operational',
    manufacturer: 'Nissei Plastic (Nhật Bản)',
    model: 'FNX280-III / SN: NS-280-881',
    operator: 'Hoàng Đức Thịnh (0904.331.229)',
    commissionDate: '2021-11-05',
    maintenanceInterval: 45,
    lastMaintenance: '2026-10-10',
    nextDue: '2026-11-24',
    value: 2600000000,
    operatingHours: 9240,
    specs: 'Lực kẹp 280 tấn, Thể tích phun tối đa 650 cm³, Bộ điều khiển NC5000, Kèm cánh tay robot gắp cuống'
  },
  {
    id: 'ast-006',
    code: 'EQ-INJ-002',
    name: 'Máy Ép Nhựa Điện Toàn Phần Sumitomo 180T',
    category: 'Máy Ép Nhựa Thủy Lực',
    department: 'Xưởng Đúc Ép B',
    location: 'Line Ép Chính Xác - Máy E2',
    status: 'maintenance',
    manufacturer: 'Sumitomo Heavy (Nhật Bản)',
    model: 'SE180EV-A / SN: SM-180-2024',
    operator: 'Hoàng Đức Thịnh (0904.331.229)',
    commissionDate: '2024-02-18',
    maintenanceInterval: 60,
    lastMaintenance: '2026-08-30',
    nextDue: '2026-10-29', // Vừa đến hạn hôm qua
    value: 2950000000,
    operatingHours: 3200,
    specs: '100% Servo điện, Tiết kiệm 60% điện năng, Đang thay thế đầu bơm phun và vệ sinh thanh nhiệt'
  },
  {
    id: 'ast-007',
    code: 'EQ-SMT-001',
    name: 'Máy Gắn Chip SMT Tốc Độ Cao Yamaha YSM20R',
    category: 'Dây Chuyền SMT Gắn Chip',
    department: 'Xưởng SMT Điện Tử C',
    location: 'Line SMT 01 - Trạm Mounter',
    status: 'operational',
    manufacturer: 'Yamaha Motor (Nhật Bản)',
    model: 'YSM20R Dual Beam / SN: YMH-5521',
    operator: 'Vũ Thị Thanh Hà (0966.778.990)',
    commissionDate: '2023-09-01',
    maintenanceInterval: 30,
    lastMaintenance: '2026-10-15',
    nextDue: '2026-11-14',
    value: 4200000000,
    operatingHours: 5600,
    specs: 'Tốc độ 95.000 CPH, Khả năng gắn linh kiện từ 0201mm đến 55mm, Camera nhận dạng đa trục 3D'
  },
  {
    id: 'ast-008',
    code: 'EQ-SMT-002',
    name: 'Lò Hàn Đối Lưu Reflow Oven Heller 1809 MK5',
    category: 'Dây Chuyền SMT Gắn Chip',
    department: 'Xưởng SMT Điện Tử C',
    location: 'Line SMT 01 - Trạm Lò Hàn',
    status: 'operational',
    manufacturer: 'Heller Industries (Mỹ)',
    model: '1809 MK5 Nitrogen / SN: HL-1809-77',
    operator: 'Phạm Đức Hải (0934.123.456)',
    commissionDate: '2023-09-01',
    maintenanceInterval: 60,
    lastMaintenance: '2026-09-12',
    nextDue: '2026-11-11',
    value: 1650000000,
    operatingHours: 5400,
    specs: '9 vùng gia nhiệt trên/dưới độc lập, Bầu khí Nitơ N2 khử oxy hóa, Profile nhiệt độ tự động KIC'
  },
  {
    id: 'ast-009',
    code: 'EQ-VIS-001',
    name: 'Máy Kiểm Tra Ngoại Quan Tự Động SDragon QC Vision AI',
    category: 'Máy Kiểm Tra Vision AI / AOI',
    department: 'Phòng QC & Đo Lường',
    location: 'Trạm Kiểm Tra Cuối Chuyền 1',
    status: 'operational',
    manufacturer: 'SDragon Vision AI (Việt Nam)',
    model: 'SD-VISION-PRO-4K / SN: SD-2026-001',
    operator: 'Nguyễn Ngọc Hùng (0945.889.911)',
    commissionDate: '2024-01-15',
    maintenanceInterval: 30,
    lastMaintenance: '2026-10-20',
    nextDue: '2026-11-19',
    value: 850000000,
    operatingHours: 3800,
    specs: 'Camera công nghiệp HikRobot 20MP, Lens Moritex telecentric, Đèn vòm đa hướng, AI ONNX Runtime YOLOv8n',
    lastCheckSheet: {
      date: '2026-10-30',
      time: '08:00',
      shift: 'Ca 1 (06:00 - 14:00)',
      inspector: 'Nguyễn Ngọc Hùng',
      status: 'PASS',
      passedCount: 10,
      totalCount: 10,
      summary: '10/10 ĐẠT'
    }
  },
  {
    id: 'ast-010',
    code: 'EQ-VIS-002',
    name: 'Máy Đo Tọa Độ 3D Không Tiếp Xúc Keyence CMM',
    category: 'Máy Kiểm Tra Vision AI / AOI',
    department: 'Phòng QC & Đo Lường',
    location: 'Phòng Lab Đo Lường Chuẩn ISO',
    status: 'calibration',
    manufacturer: 'Keyence Corporation (Nhật Bản)',
    model: 'VR-6000 3D Macro / SN: KY-VR6-339',
    operator: 'Bùi Thị Lan (0918.445.667)',
    commissionDate: '2023-06-25',
    maintenanceInterval: 180,
    lastMaintenance: '2026-05-02',
    nextDue: '2026-10-29', // Cần hiệu chuẩn
    value: 2100000000,
    operatingHours: 2400,
    specs: 'Độ chính xác đo lường 0.1µm, Quét độ nhám bề mặt Ra/Rz, Bàn dịch chuyển tự động khí nén chống rung'
  },
  {
    id: 'ast-011',
    code: 'EQ-AIR-001',
    name: 'Máy Nén Khí Trục Vít Biến Tần Atlas Copco 75kW',
    category: 'Máy Nén Khí Trục Vít',
    department: 'Trạm Cấp Nguồn & Phụ Trợ',
    location: 'Nhà Vận Hành Khí Nén Trung Tâm',
    status: 'operational',
    manufacturer: 'Atlas Copco (Bỉ)',
    model: 'GA 75 VSD+ / SN: AC-75-9921',
    operator: 'Đỗ Văn Cường (0979.888.777)',
    commissionDate: '2022-04-10',
    maintenanceInterval: 90,
    lastMaintenance: '2026-08-25',
    nextDue: '2026-11-23',
    value: 1350000000,
    operatingHours: 14200,
    specs: 'Lưu lượng khí 14.2 m³/phút, Áp suất 8.5 bar, Động cơ nam châm vĩnh cửu iPM biến tần tiết kiệm điện'
  },
  {
    id: 'ast-012',
    code: 'EQ-AIR-002',
    name: 'Máy Sấy Khí Hấp Thụ & Cụm Lọc Khí Nén Orion',
    category: 'Máy Nén Khí Trục Vít',
    department: 'Trạm Cấp Nguồn & Phụ Trợ',
    location: 'Sau bình tích áp trung tâm',
    status: 'operational',
    manufacturer: 'Orion Machinery (Nhật Bản)',
    model: 'QSQ-1200 / SN: OR-120-441',
    operator: 'Đỗ Văn Cường (0979.888.777)',
    commissionDate: '2022-04-10',
    maintenanceInterval: 60,
    lastMaintenance: '2026-09-18',
    nextDue: '2026-11-17',
    value: 480000000,
    operatingHours: 14200,
    specs: 'Điểm sương đọng sương -40°C (Dew point), Lọc hạt bụi 0.01 micron, Cấp khí sạch cho phòng SMT'
  },
  {
    id: 'ast-013',
    code: 'EQ-CV-001',
    name: 'Hệ Thống Băng Tải Lắp Ráp Pallet Tuần Hoàn',
    category: 'Băng Tải & Cấp Liệu Tự Động',
    department: 'Xưởng Lắp Ráp & Đóng Gói D',
    location: 'Line Lắp Ráp Hoàn Thiện Line 1',
    status: 'operational',
    manufacturer: 'SDragon Automation (Việt Nam)',
    model: 'SD-CV-PALLET-30M / SN: SD-CV-01',
    operator: 'Lê Minh Tuấn (0915.667.889)',
    commissionDate: '2023-04-18',
    maintenanceInterval: 45,
    lastMaintenance: '2026-09-28',
    nextDue: '2026-11-12',
    value: 650000000,
    operatingHours: 7100,
    specs: 'Chiều dài 32m, Động cơ Servo kéo xích tải kép, 18 trạm làm việc tự động định vị RFID stopper'
  },
  {
    id: 'ast-014',
    code: 'EQ-CV-002',
    name: 'Máy Đóng Thùng & Dán Băng Dính Thùng Tự Động',
    category: 'Băng Tải & Cấp Liệu Tự Động',
    department: 'Xưởng Lắp Ráp & Đóng Gói D',
    location: 'Khu Vực Đóng Gói Xuất Kho',
    status: 'operational',
    manufacturer: 'Siapack (Ý)',
    model: 'SM11-Auto / SN: SIA-9902',
    operator: 'Vũ Đức Nam (0988.332.112)',
    commissionDate: '2023-10-10',
    maintenanceInterval: 30,
    lastMaintenance: '2026-10-12',
    nextDue: '2026-11-11',
    value: 390000000,
    operatingHours: 4200,
    specs: 'Tốc độ 15 thùng/phút, Dán 2 mặt đáy và nắp đồng thời, Cảm biến an toàn rèm quang học'
  },
  {
    id: 'ast-015',
    code: 'EQ-CNC-003',
    name: 'Máy Mài Phẳng Thủy Lực Siêu Chính Xác Okamoto',
    category: 'Máy Phay / Tiện CNC',
    department: 'Xưởng Cơ Khí A',
    location: 'Xưởng Khuôn Mẫu - Ô 05',
    status: 'standby',
    manufacturer: 'Okamoto Machine Tool (Nhật Bản)',
    model: 'PSG-63DX / SN: OKM-63-128',
    operator: 'Trần Đình Trọng (0973.554.211)',
    commissionDate: '2020-07-15',
    maintenanceInterval: 90,
    lastMaintenance: '2026-07-10',
    nextDue: '2026-10-08', // Quá hạn
    value: 1100000000,
    operatingHours: 8900,
    specs: 'Kích thước bàn mài 600x300mm, Độ phẳng gia công 0.002mm, Mâm từ vĩnh cửu công suất lớn'
  },
  {
    id: 'ast-016',
    code: 'EQ-INJ-003',
    name: 'Cụm Máy Sấy Hút Nhựa & Máy Cấp Liệu Trung Tâm',
    category: 'Máy Ép Nhựa Thủy Lực',
    department: 'Xưởng Đúc Ép B',
    location: 'Sàn Cấp Liệu Nhựa Tầng 2',
    status: 'operational',
    manufacturer: 'Matsui (Nhật Bản)',
    model: 'MJ5-i / SN: MT-MJ5-771',
    operator: 'Hoàng Đức Thịnh (0904.331.229)',
    commissionDate: '2022-01-20',
    maintenanceInterval: 60,
    lastMaintenance: '2026-09-05',
    nextDue: '2026-11-04', // Sắp đến hạn trong 5 ngày
    value: 720000000,
    operatingHours: 9800,
    specs: 'Năng suất sấy 120kg/h hạt nhựa kỹ thuật ABS/PC/PA, Khử ẩm hạt nhựa xuống dưới 0.02% ẩm'
  }
];

// Initial Factory Maintenance Records
const DEMO_LOGS = [
  {
    id: 'log-001',
    assetId: 'ast-001',
    assetCode: 'EQ-CNC-001',
    assetName: 'Máy Phay CNC 5 Trục Mazak Variaxis',
    date: '2026-09-10',
    type: 'Bảo dưỡng định kỳ',
    description: 'Thay dầu làm mát trục chính spindle chiller, bôi mỡ ray dẫn hướng các trục X/Y/Z, kiểm tra độ rơ backlash trục xoay B/C.',
    technician: 'Lê Minh Tuấn & Đội Kỹ Thuật Mazak',
    cost: 18500000,
    resultStatus: 'operational'
  },
  {
    id: 'log-002',
    assetId: 'ast-006',
    assetCode: 'EQ-INJ-002',
    assetName: 'Máy Ép Nhựa Điện Toàn Phần Sumitomo 180T',
    date: '2026-10-29',
    type: 'Sửa chữa sự cố',
    description: 'Nòng xylanh nạp nhựa bị rò nhiệt, tháo kiểm tra và thay thế bộ vòng nhiệt gốm 5kW + cảm biến nhiệt can nhiệt K.',
    technician: 'Hoàng Đức Thịnh',
    cost: 8200000,
    resultStatus: 'maintenance'
  },
  {
    id: 'log-003',
    assetId: 'ast-004',
    assetCode: 'EQ-ROBOT-002',
    assetName: 'Cánh Tay Robot Bốc Xếp Phôi ABB IRB',
    date: '2026-10-28',
    type: 'Sửa chữa sự cố',
    description: 'Báo lỗi Driver servo Joint 3 (Kẹt tải cơ khí), đang chờ kỹ sư ABB đến thay thế hộp số hành tinh và kiểm tra cáp mã hóa encoder.',
    technician: 'Nguyễn Văn Hùng',
    cost: 32000000,
    resultStatus: 'down'
  },
  {
    id: 'log-004',
    assetId: 'ast-009',
    assetCode: 'EQ-VIS-001',
    assetName: 'Máy Kiểm Tra Ngoại Quan SDragon QC Vision AI',
    date: '2026-10-20',
    type: 'Bảo dưỡng định kỳ',
    description: 'Vệ sinh thấu kính vi sai telecentric, hiệu chỉnh độ đồng đều nguồn sáng LED vòm, sao lưu trọng số mô hình AI YOLOv8n v2.2.',
    technician: 'Nguyễn Ngọc Hùng',
    cost: 1500000,
    resultStatus: 'operational'
  },
  {
    id: 'log-005',
    assetId: 'ast-007',
    assetCode: 'EQ-SMT-001',
    assetName: 'Máy Gắn Chip SMT Tốc Độ Cao Yamaha YSM20R',
    date: '2026-10-15',
    type: 'Thay thế linh kiện',
    description: 'Thay thế 4 đầu hút nozzle cao su chống tĩnh điện, căn chỉnh lại camera nhận dạng linh kiện siêu nhỏ 0201.',
    technician: 'Vũ Thị Thanh Hà',
    cost: 6400000,
    resultStatus: 'operational'
  }
];

/**
 * Data Storage Manager Class
 */

// Danh sách phiếu kiểm tra Track Sheet mẫu (Inspection History)
const DEMO_INSPECTIONS = [
  {
    id: 'insp-001',
    assetId: 'ast-001',
    assetCode: 'EQ-CNC-001',
    assetName: 'Máy Phay CNC 5 Trục Mazak Variaxis',
    department: 'Xưởng Cơ Khí A',
    date: '2026-10-30',
    time: '08:15',
    shift: 'Ca 1 (06:00 - 14:00)',
    inspector: 'Nguyễn Văn Hùng',
    inspectorRole: 'Kỹ Thuật Viên',
    status: 'PASS',
    passedCount: 10,
    totalCount: 10,
    overallNotes: 'Điện áp 382V ổn định, áp suất khí nén 6.2 bar đạt chuẩn. Các trục X/Y/Z vận hành êm ái, bôi trơn tốt.',
    items: [
      { id: 1, name: 'Điện áp nguồn cung cấp', standard: '380V ± 10%', method: 'Vôn kế tủ điện', value: '382V', result: 'OK', note: '' },
      { id: 2, name: 'Áp suất khí nén cấp vào', standard: '5.0 - 7.0 bar', method: 'Đồng hồ áp FRL', value: '6.2 bar', result: 'OK', note: '' },
      { id: 3, name: 'Mức & Chất lượng dầu bôi trơn / Thủy lực', standard: 'Vạch MIN-MAX', method: 'Mắt thăm dầu', value: 'Mức 85% MAX', result: 'OK', note: '' },
      { id: 4, name: 'Nhiệt độ motor & Trục Spindle', standard: '< 65°C', method: 'Súng hồng ngoại', value: '47°C', result: 'OK', note: '' },
      { id: 5, name: 'Độ rung động & Tiếng ồn vận hành', standard: 'Chạy êm, không rít', method: 'Lắng nghe & cảm nhận', value: 'Bình thường, êm', result: 'OK', note: '' },
      { id: 6, name: 'Nút E-Stop & Cảm biến an toàn', standard: 'Tác động tức thì', method: 'Bấm thử E-Stop', value: 'Nhạy tốt', result: 'OK', note: '' },
      { id: 7, name: 'Kiểm tra rò rỉ khí / dầu / nước', standard: 'Kín hoàn toàn', method: 'Quan sát cút nối & bệ', value: 'Khô ráo, kín', result: 'OK', note: '' },
      { id: 8, name: 'Quạt làm mát & Lưới lọc bụi tủ điện', standard: 'Quạt quay, lưới sạch', method: 'Kiểm tra luồng gió', value: 'Quạt tốt', result: 'OK', note: '' },
      { id: 9, name: 'Dây tiếp địa vỏ máy & Cáp điện', standard: 'Tiếp địa siết chặt', method: 'Quan sát tiếp địa', value: 'Chắc chắn', result: 'OK', note: '' },
      { id: 10, name: 'Đèn tháp trạng thái (Tower Light) & Còi', standard: 'Đèn/còi hoạt động đúng', method: 'Bảng điều khiển', value: 'Sáng chuẩn', result: 'OK', note: '' }
    ]
  },
  {
    id: 'insp-002',
    assetId: 'ast-004',
    assetCode: 'EQ-ROBOT-002',
    assetName: 'Cánh Tay Robot Bốc Xếp Phôi ABB IRB',
    department: 'Xưởng Cơ Khí A',
    date: '2026-10-30',
    time: '07:45',
    shift: 'Ca 1 (06:00 - 14:00)',
    inspector: 'Nguyễn Văn Hùng',
    inspectorRole: 'Kỹ Thuật Viên',
    status: 'FAIL',
    passedCount: 8,
    totalCount: 10,
    overallNotes: 'Phát hiện tiếng rít cơ khí tại khớp trục số 3 (Joint 3). Cáp tín hiệu có dấu hiệu cọ xát. Yêu cầu dừng chuyền kiểm tra hộp số.',
    items: [
      { id: 1, name: 'Điện áp nguồn cung cấp', standard: '380V ± 10%', method: 'Vôn kế tủ điện', value: '380V', result: 'OK', note: '' },
      { id: 2, name: 'Áp suất khí nén cấp vào', standard: '5.0 - 7.0 bar', method: 'Đồng hồ áp FRL', value: '5.8 bar', result: 'OK', note: '' },
      { id: 3, name: 'Mức & Chất lượng dầu bôi trơn / Thủy lực', standard: 'Vạch MIN-MAX', method: 'Mắt thăm dầu', value: 'Vạch 70%', result: 'OK', note: '' },
      { id: 4, name: 'Nhiệt độ motor & Trục Spindle', standard: '< 65°C', method: 'Súng hồng ngoại', value: '58°C', result: 'OK', note: 'Motor trục 3 hơi nóng' },
      { id: 5, name: 'Độ rung động & Tiếng ồn vận hành', standard: 'Chạy êm, không rít', method: 'Lắng nghe & cảm nhận', value: 'Rung & tiếng rít cơ khí', result: 'NG', note: 'Lỗi kẹt tải cơ khí trục 3' },
      { id: 6, name: 'Nút E-Stop & Cảm biến an toàn', standard: 'Tác động tức thì', method: 'Bấm thử E-Stop', value: 'Nhạy tốt', result: 'OK', note: '' },
      { id: 7, name: 'Kiểm tra rò rỉ khí / dầu / nước', standard: 'Kín hoàn toàn', method: 'Quan sát cút nối & bệ', value: 'Không rò rỉ', result: 'OK', note: '' },
      { id: 8, name: 'Quạt làm mát & Lưới lọc bụi tủ điện', standard: 'Quạt quay, lưới sạch', method: 'Kiểm tra luồng gió', value: 'Quạt tốt', result: 'OK', note: '' },
      { id: 9, name: 'Dây tiếp địa vỏ máy & Cáp điện', standard: 'Tiếp địa siết chặt', method: 'Quan sát tiếp địa', value: 'Cáp cọ xát bệ', result: 'NG', note: 'Vỏ cáp encoder cọ xát ray' },
      { id: 10, name: 'Đèn tháp trạng thái (Tower Light) & Còi', standard: 'Đèn/còi hoạt động đúng', method: 'Bảng điều khiển', value: 'Báo lỗi đèn Vàng/Đỏ', result: 'OK', note: '' }
    ]
  },
  {
    id: 'insp-003',
    assetId: 'ast-009',
    assetCode: 'EQ-VIS-001',
    assetName: 'Máy Kiểm Tra Ngoại Quan SDragon QC Vision AI',
    department: 'Phòng QC & Đo Lường',
    date: '2026-10-30',
    time: '08:00',
    shift: 'Ca 1 (06:00 - 14:00)',
    inspector: 'Nguyễn Ngọc Hùng',
    inspectorRole: 'Kỹ Sư AI',
    status: 'PASS',
    passedCount: 10,
    totalCount: 10,
    overallNotes: 'Nguồn 220V ổn định, đèn vòm LED sáng đều 100%, camera HikRobot nhận dạng chuẩn, nhiệt độ PC AI 52°C mát mẻ.',
    items: [
      { id: 1, name: 'Điện áp nguồn cung cấp', standard: '220V ± 5%', method: 'UPS Online', value: '221V', result: 'OK', note: 'UPS ổn định' },
      { id: 2, name: 'Áp suất khí nén cấp vào', standard: '5.0 - 7.0 bar', method: 'Đồng hồ cụm xilanh gạt NG', value: '6.0 bar', result: 'OK', note: '' },
      { id: 3, name: 'Mức & Chất lượng dầu bôi trơn', standard: 'Ray trượt telecentric', method: 'Quan sát ray', value: 'Bôi mỡ mỏng', result: 'OK', note: '' },
      { id: 4, name: 'Nhiệt độ PC Công nghiệp & Đèn', standard: '< 65°C', method: 'Phần mềm giám sát', value: '52°C', result: 'OK', note: 'GPU mát' },
      { id: 5, name: 'Độ rung động bệ camera', standard: 'Không rung lắc', method: 'Cảm nhận đế nhôm', value: 'Rất êm', result: 'OK', note: '' },
      { id: 6, name: 'Nút E-Stop & Cảm biến quang trigger', standard: 'Trigger tức thời', method: 'Thử phôi test', value: 'Bắt phôi chuẩn 100%', result: 'OK', note: '' },
      { id: 7, name: 'Kiểm tra rò rỉ khí xylanh đẩy NG', standard: 'Không xì khí', method: 'Lắng nghe xilanh', value: 'Kín, êm', result: 'OK', note: '' },
      { id: 8, name: 'Quạt hút tản nhiệt vỏ máy Vision', standard: 'Quạt thổi mạnh', method: 'Kiểm tra luồng gió', value: 'Quạt tốt', result: 'OK', note: '' },
      { id: 9, name: 'Dây tiếp địa chống nhiễu camera', standard: 'Tiếp địa chuẩn', method: 'Đo tiếp địa tủ', value: '2.1 Ohm', result: 'OK', note: 'Chống nhiễu tốt' },
      { id: 10, name: 'Đèn tháp Tower Light báo OK/NG', standard: 'Xanh OK, Đỏ NG', method: 'Kích hoạt thử lỗi', value: 'Chuẩn xác', result: 'OK', note: '' }
    ]
  }
];

class AssetDataStore {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    // Purge AI demo machines completely as requested by user
    if (!localStorage.getItem('sdragon_cleared_ai_demo_v2')) {
      localStorage.setItem(STORAGE_KEYS.ASSETS, '[]');
      localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, '[]');
      localStorage.setItem('sdragon_cleared_ai_demo_v2', 'true');
      localStorage.setItem('sdragon_user_cleared_ai_demo', 'true');
      console.log("Purged AI demo machines. Database is clean for manual user entry.");
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
      localStorage.setItem(STORAGE_KEYS.ASSETS, '[]');
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSPECTIONS)) {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, '[]');
    }
  }


  // Reset to default seed dataset
  resetToDemoData() {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(DEMO_ASSETS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEMO_LOGS));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(DEMO_INSPECTIONS));
  }

  // Get all assets - returns exact user dataset, no AI auto-seed
  getAssets() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading assets:", e);
      return [];
    }
  }

  // Clear all assets (clean slate for manual entry)
  clearAllAssets() {
    localStorage.setItem(STORAGE_KEYS.ASSETS, '[]');
    localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, '[]');
    localStorage.setItem('sdragon_user_cleared_ai_demo', 'true');
  }

  // Get single asset by ID
  getAssetById(id) {
    const assets = this.getAssets();
    return assets.find(a => a.id === id) || null;
  }

  // Get single asset by Code
  getAssetByCode(code) {
    const assets = this.getAssets();
    return assets.find(a => a.code.toLowerCase() === code.toLowerCase().trim()) || null;
  }

  // Save asset (Add new or Update existing)
  saveAsset(assetData) {
    const assets = this.getAssets();
    if (!assetData.id) {
      // New asset
      assetData.id = 'ast-' + Date.now();
      assets.unshift(assetData);
    } else {
      // Update
      const index = assets.findIndex(a => a.id === assetData.id);
      if (index !== -1) {
        assets[index] = { ...assets[index], ...assetData };
      } else {
        assets.unshift(assetData);
      }
    }
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    return assetData;
  }

  // Delete single asset
  deleteAsset(id) {
    let assets = this.getAssets();
    assets = assets.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  }

  // Delete multiple assets
  deleteMultipleAssets(ids) {
    let assets = this.getAssets();
    const setIds = new Set(ids);
    assets = assets.filter(a => !setIds.has(a.id));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  }

  // Maintenance Logs Operations
  getLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getLogsByAssetId(assetId) {
    const logs = this.getLogs();
    return logs.filter(l => l.assetId === assetId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addMaintenanceLog(logData) {
    const logs = this.getLogs();
    logData.id = 'log-' + Date.now();
    logs.unshift(logData);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));

    // Also update asset status and calculate new nextDue date
    const asset = this.getAssetById(logData.assetId);
    if (asset) {
      asset.status = logData.resultStatus;
      asset.lastMaintenance = logData.date;
      
      // Auto-compute next due date = maintenanceDate + interval
      const intervalDays = parseInt(asset.maintenanceInterval, 10) || 90;
      const maintDate = new Date(logData.date);
      maintDate.setDate(maintDate.getDate() + intervalDays);
      asset.nextDue = maintDate.toISOString().split('T')[0];

      this.saveAsset(asset);
    }
    return logData;
  }

  // Auto generate unique asset code based on category
  generateAssetCode(category) {
    const prefixMap = {
      'Máy Phay / Tiện CNC': 'EQ-CNC',
      'Cánh Tay Robot Công Nghiệp': 'EQ-ROBOT',
      'Máy Ép Nhựa Thủy Lực': 'EQ-INJ',
      'Dây Chuyền SMT Gắn Chip': 'EQ-SMT',
      'Máy Kiểm Tra Vision AI / AOI': 'EQ-VIS',
      'Máy Nén Khí Trục Vít': 'EQ-AIR',
      'Băng Tải & Cấp Liệu Tự Động': 'EQ-CV'
    };
    const prefix = prefixMap[category] || 'EQ-GEN';
    const assets = this.getAssets();
    const matching = assets.filter(a => a.code.startsWith(prefix));
    const nextNum = (matching.length + 1).toString().padStart(3, '0');
    return `${prefix}-${nextNum}`;
  }

  // Export database to JSON
  exportBackupJSON() {
    const data = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      assets: this.getAssets(),
      logs: this.getLogs()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SDragon_Asset_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import database from JSON
  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.assets)) {
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
        if (Array.isArray(data.logs)) {
          localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Invalid JSON:", e);
      return false;
    }
  }

  // Export Track Sheet to CSV (Excel compatible with UTF-8 BOM)
    // ================= TRACK SHEET INSPECTION METHODS =================
  getInspections() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading inspections:", e);
      return [];
    }
  }

  getInspectionsByAssetId(assetId) {
    const inspections = this.getInspections();
    return inspections.filter(i => i.assetId === assetId).sort((a, b) => {
      const dtA = (a.date || '') + ' ' + (a.time || '');
      const dtB = (b.date || '') + ' ' + (b.time || '');
      return dtB.localeCompare(dtA);
    });
  }

  getInspectionById(id) {
    const inspections = this.getInspections();
    return inspections.find(i => i.id === id) || null;
  }

  deleteInspection(id) {
    const inspections = this.getInspections();
    const target = inspections.find(i => i.id === id);
    const updated = inspections.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(updated));

    // Update asset's lastCheckSheet if the deleted inspection was the latest one
    if (target && target.assetId) {
      const asset = this.getAssetById(target.assetId);
      if (asset) {
        const remainingForAsset = updated
          .filter(i => i.assetId === target.assetId)
          .sort((a, b) => {
            const dtA = (a.date || '') + ' ' + (a.time || '');
            const dtB = (b.date || '') + ' ' + (b.time || '');
            return dtB.localeCompare(dtA);
          });
        if (remainingForAsset.length > 0) {
          const latest = remainingForAsset[0];
          asset.lastCheckSheet = {
            date: latest.date,
            time: latest.time,
            shift: latest.shift,
            inspector: latest.inspector,
            status: latest.status,
            passedCount: latest.passedCount,
            totalCount: latest.totalCount,
            summary: latest.status === 'PASS' ? `${latest.passedCount}/${latest.totalCount} ĐẠT` : `${latest.totalCount - latest.passedCount} MỤC NG`
          };
        } else {
          asset.lastCheckSheet = null;
        }
        this.saveAsset(asset);
      }
    }
    return true;
  }

  addInspection(inspectionData) {
    const list = this.getInspections();
    inspectionData.id = 'insp-' + Date.now();
    list.unshift(inspectionData);
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(list));

    // Also update asset's lastCheckSheet summary
    const asset = this.getAssetById(inspectionData.assetId);
    if (asset) {
      asset.lastCheckSheet = {
        date: inspectionData.date,
        time: inspectionData.time,
        shift: inspectionData.shift,
        inspector: inspectionData.inspector,
        status: inspectionData.status,
        passedCount: inspectionData.passedCount,
        totalCount: inspectionData.totalCount,
        summary: inspectionData.status === 'PASS' ? `${inspectionData.passedCount}/${inspectionData.totalCount} ĐẠT` : `${inspectionData.totalCount - inspectionData.passedCount} MỤC NG`
      };

      // If inspection failed, ask or auto-flag machine status
      if (inspectionData.status === 'FAIL') {
        asset.status = 'down'; // Chuyển sang sự cố để xưởng xử lý
      } else if (asset.status === 'down' && inspectionData.status === 'PASS') {
        asset.status = 'operational'; // Khôi phục hoạt động nếu đã kiểm tra đạt
      }

      this.saveAsset(asset);
    }
    return inspectionData;
  }

  exportInspectionsToCSV() {
    const inspections = this.getInspections();
    const headers = [
      'Mã Phiếu',
      'Mã Thiết Bị',
      'Tên Máy Móc',
      'Phân Xưởng',
      'Ngày Kiểm Tra',
      'Giờ',
      'Ca Làm Việc',
      'Người Kiểm Tra',
      'Kết Quả Chung',
      'Số Mục Đạt',
      'Ghi Chú Đánh Giá'
    ];

    const rows = inspections.map(i => [
      `"${i.id}"`,
      `"${i.assetCode}"`,
      `"${(i.assetName || '').replace(/"/g, '""')}"`,
      `"${i.department || ''}"`,
      `"${i.date}"`,
      `"${i.time}"`,
      `"${i.shift}"`,
      `"${i.inspector}"`,
      `"${i.status === 'PASS' ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)'}"`,
      `"${i.passedCount}/${i.totalCount}"`,
      `"${(i.overallNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDragon_TrackSheet_Inspections_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

exportToCSV(assetsToExport = null) {
    const list = assetsToExport || this.getAssets();
    const headers = [
      'Mã Tài Sản',
      'Tên Máy Móc Thiết Bị',
      'Chủng Loại',
      'Phân Xưởng',
      'Vị Trí',
      'Trạng Thái',
      'Hãng Sản Xuất',
      'Model/Serial',
      'Người Phụ Trách',
      'Ngày Vận Hành',
      'Chu Kỳ BD (Ngày)',
      'Hạn Bảo Dưỡng',
      'Nguyên Giá (VNĐ)',
      'Giờ Chạy (H)'
    ];

    const statusMap = {
      'operational': 'Đang hoạt động',
      'maintenance': 'Đang bảo dưỡng',
      'down': 'Sự cố dừng máy',
      'calibration': 'Chờ kiểm định',
      'standby': 'Dự phòng'
    };

    const rows = list.map(a => [
      `"${a.code || ''}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.category || ''}"`,
      `"${a.department || ''}"`,
      `"${a.location || ''}"`,
      `"${statusMap[a.status] || a.status}"`,
      `"${a.manufacturer || ''}"`,
      `"${a.model || ''}"`,
      `"${a.operator || ''}"`,
      `"${a.commissionDate || ''}"`,
      `"${a.maintenanceInterval || 90}"`,
      `"${a.nextDue || ''}"`,
      `"${a.value || 0}"`,
      `"${a.operatingHours || 0}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDragon_TrackSheet_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Global shared helper formatters
const DateHelper = {
  // Format YYYY-MM-DD to DD/MM/YYYY
  formatVN(dateStr) {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  // Compute days difference between dateStr and today
  // returns { days: number, isOverdue: boolean, isWithin7Days: boolean, text: string }
  calculateDueStatus(dueDateStr) {
    if (!dueDateStr) return { days: 999, isOverdue: false, isWithin7Days: false, text: 'Chưa đặt' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffMs = due - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: diffDays,
        isOverdue: true,
        isWithin7Days: false,
        text: `Quá hạn ${Math.abs(diffDays)} ngày`
      };
    } else if (diffDays === 0) {
      return {
        days: 0,
        isOverdue: false,
        isWithin7Days: true,
        text: 'Hôm nay đến hạn'
      };
    } else if (diffDays <= 7) {
      return {
        days: diffDays,
        isOverdue: false,
        isWithin7Days: true,
        text: `Còn ${diffDays} ngày`
      };
    } else {
      return {
        days: diffDays,
        isOverdue: false,
        isWithin7Days: false,
        text: `Còn ${diffDays} ngày`
      };
    }
  }
};

const NumberHelper = {
  // Format to VNĐ: 1500000000 -> "1.500.000.000 ₫"
  formatCurrencyVN(num) {
    if (num === null || num === undefined || isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  },

  // Format compact for KPI: 1500000000 -> "1.5 Tỷ ₫"
  formatCompactVN(num) {
    if (!num || isNaN(num)) return '0 ₫';
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2).replace('.', ',') + ' Tỷ ₫';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.', ',') + ' Tr ₫';
    }
    return NumberHelper.formatCurrencyVN(num);
  }
};

// Initialize global store
const store = new AssetDataStore();
