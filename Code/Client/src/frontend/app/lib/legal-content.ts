/**
 * legal-content.ts
 * Nội dung Điều khoản sử dụng, Chính sách bảo mật và Thông báo về Thông tư 88/2021/TT-BTC.
 * Dùng chung cho màn hình Đăng ký (xác nhận điều khoản) và các màn hình liên quan.
 */

//Phiên bản văn bản
export const TERMS_VERSION = '1.0';
export const PRIVACY_VERSION = '1.0';

//Kiểu dữ liệu
export type LegalDocKey = 'terms' | 'privacy' | 'circular88';

export interface LegalSubSection {
  heading: string;
  bullets: string[];
}

export interface LegalSection {
  heading: string;
  body?: string;
  bullets?: string[];
  subSections?: LegalSubSection[];
}

export interface LegalDoc {
  title: string;
  version?: string;
  intro?: string;
  sections: LegalSection[];
}

/** Trạng thái 6 mục xác nhận của người dùng. */
export interface ConsentState {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingAccepted: boolean;
  circular88Accepted: boolean;
  infoAccurateConfirmed: boolean;
  inaccuracyUnderstood: boolean;
}

/** Danh sách key của 6 mục xác nhận, dùng cho mục "Đồng ý tất cả". */
export const ALL_CONSENT_KEYS: (keyof ConsentState)[] = [
  'termsAccepted',
  'privacyAccepted',
  'dataProcessingAccepted',
  'circular88Accepted',
  'infoAccurateConfirmed',
  'inaccuracyUnderstood',
];

export const EMPTY_CONSENT: ConsentState = {
  termsAccepted: false,
  privacyAccepted: false,
  dataProcessingAccepted: false,
  circular88Accepted: false,
  infoAccurateConfirmed: false,
  inaccuracyUnderstood: false,
};

export function isAllConsented(c: ConsentState): boolean {
  return ALL_CONSENT_KEYS.every((key) => c[key]);
}

export interface ConsentSegment {
  text: string;
  /** Nếu có, render thành link mở modal xem chi tiết. */
  link?: LegalDocKey;
}

export interface ConsentItem {
  key: keyof ConsentState;
  segments: ConsentSegment[];
}

export const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'termsAccepted',
    segments: [
      { text: 'Tôi đã đọc và đồng ý với ' },
      { text: 'Điều khoản sử dụng', link: 'terms' },
      { text: '.' },
    ],
  },
  {
    key: 'privacyAccepted',
    segments: [
      { text: 'Tôi đã đọc và đồng ý với ' },
      { text: 'Chính sách bảo mật', link: 'privacy' },
      { text: '.' },
    ],
  },
  {
    key: 'dataProcessingAccepted',
    segments: [
      {
        text: 'Tôi đồng ý cho phép Nền tảng xử lý dữ liệu kinh doanh của mình nhằm phục vụ việc quản lý và vận hành hệ thống.',
      },
    ],
  },
  {
    key: 'circular88Accepted',
    segments: [
      { text: 'Tôi hiểu rằng dữ liệu kinh doanh có thể được sử dụng để hỗ trợ lập sổ kế toán theo ' },
      { text: 'Thông tư 88/2021/TT-BTC', link: 'circular88' },
      { text: ', bao gồm các sổ S1-HKD, S2-HKD và S4-HKD.' },
    ],
  },
  {
    key: 'infoAccurateConfirmed',
    segments: [{ text: 'Tôi xác nhận các thông tin đã cung cấp là chính xác và đầy đủ.' }],
  },
  {
    key: 'inaccuracyUnderstood',
    segments: [
      {
        text: 'Tôi hiểu rằng việc cung cấp thông tin không chính xác có thể dẫn đến các báo cáo hoặc sổ kế toán không đúng với thực tế.',
      },
    ],
  },
];

//Văn bản: ĐIỀU KHOẢN SỬ DỤNG
export const TERMS_OF_USE: LegalDoc = {
  title: 'ĐIỀU KHOẢN SỬ DỤNG',
  version: TERMS_VERSION,
  intro:
    'Vui lòng đọc kỹ Điều khoản sử dụng trước khi đăng ký tài khoản và sử dụng Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh.',
  sections: [
    {
      heading: '1. Chấp nhận điều khoản',
      body:
        'Khi đăng ký tài khoản và sử dụng Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (sau đây gọi là Nền tảng), người dùng xác nhận đã đọc, hiểu và đồng ý tuân thủ các Điều khoản sử dụng này. Nếu không đồng ý với bất kỳ điều khoản nào, người dùng không được tiếp tục sử dụng hệ thống.',
    },
    {
      heading: '2. Mục đích của nền tảng',
      body:
        'Nền tảng được phát triển nhằm hỗ trợ các hộ kinh doanh trong quá trình chuyển đổi số, bao gồm nhưng không giới hạn ở các chức năng:',
      bullets: [
        'Quản lý thông tin hộ kinh doanh',
        'Quản lý sản phẩm',
        'Quản lý kho hàng',
        'Quản lý bán hàng',
        'Quản lý khách hàng',
        'Quản lý công nợ',
        'Báo cáo và thống kê',
        'Hỗ trợ AI',
        'Hỗ trợ ghi sổ kế toán',
      ],
    },
    {
      heading: '3. Trách nhiệm của người dùng',
      body: 'Chủ hộ kinh doanh có trách nhiệm:',
      bullets: [
        'Cung cấp đầy đủ và chính xác thông tin hộ kinh doanh.',
        'Cập nhật thông tin khi có thay đổi.',
        'Bảo mật tài khoản và mật khẩu.',
        'Quản lý nhân viên được cấp quyền sử dụng hệ thống.',
        'Đảm bảo tính chính xác của dữ liệu bán hàng, hàng hóa và các thông tin nhập vào.',
      ],
    },
    {
      heading: '4. Bảo mật tài khoản',
      body: 'Người dùng có trách nhiệm:',
      bullets: [
        'Không chia sẻ mật khẩu hoặc mã xác thực cho người khác.',
        'Bảo vệ thông tin đăng nhập.',
        'Đăng xuất khỏi hệ thống khi sử dụng trên thiết bị công cộng.',
        'Thông báo ngay cho quản trị viên khi phát hiện dấu hiệu truy cập trái phép.',
      ],
    },
    {
      heading: '5. Quy định sử dụng',
      body: 'Người dùng không được:',
      bullets: [
        'Truy cập trái phép vào hệ thống.',
        'Phát tán mã độc hoặc phần mềm gây hại.',
        'Cố ý thay đổi dữ liệu của hệ thống hoặc của người dùng khác.',
        'Thực hiện các hành vi tấn công mạng.',
        'Nhập dữ liệu giả mạo hoặc sai sự thật.',
        'Sử dụng nền tảng vào mục đích trái pháp luật.',
      ],
    },
    {
      heading: '6. Dữ liệu kinh doanh',
      body: 'Người dùng xác nhận rằng:',
      bullets: [
        'Thông tin hộ kinh doanh là chính xác.',
        'Mã số thuế được khai báo đúng.',
        'Dữ liệu doanh thu, hàng hóa và công nợ phản ánh đúng hoạt động kinh doanh.',
        'Các thông tin được nhập vào thuộc quyền quản lý của người dùng.',
      ],
    },
    {
      heading: '7. Gói dịch vụ',
      body:
        'Một số chức năng của nền tảng chỉ khả dụng khi người dùng đăng ký gói dịch vụ phù hợp. Các gói dịch vụ hiện tại bao gồm: Gói Thường và Gói VIP. Tính năng được sử dụng sẽ phụ thuộc vào gói dịch vụ mà người dùng lựa chọn.',
    },
    {
      heading: '8. Tính sẵn sàng của dịch vụ',
      body:
        'Nền tảng luôn nỗ lực đảm bảo hệ thống hoạt động ổn định. Tuy nhiên, hệ thống có thể tạm thời gián đoạn trong các trường hợp:',
      bullets: [
        'Bảo trì hệ thống.',
        'Nâng cấp phần mềm.',
        'Sự cố hạ tầng.',
        'Lỗi từ các dịch vụ của bên thứ ba.',
      ],
    },
    {
      heading: '9. Giới hạn trách nhiệm',
      body: 'Nền tảng không chịu trách nhiệm đối với:',
      bullets: [
        'Các quyết định kinh doanh của người dùng.',
        'Dữ liệu sai do người dùng nhập.',
        'Sự cố kết nối Internet.',
        'Lỗi từ dịch vụ bên thứ ba.',
        'Thiệt hại do người dùng không tuân thủ quy định bảo mật.',
      ],
    },
    {
      heading: '10. Chấm dứt sử dụng',
      body: 'Nền tảng có quyền khóa hoặc chấm dứt tài khoản nếu người dùng:',
      bullets: [
        'Vi phạm Điều khoản sử dụng.',
        'Có hành vi gian lận hoặc trái pháp luật.',
        'Gây ảnh hưởng đến an toàn và bảo mật của hệ thống.',
      ],
    },
    {
      heading: '11. Cập nhật điều khoản',
      body:
        'Điều khoản sử dụng có thể được cập nhật theo từng thời điểm. Người dùng cần đọc và chấp nhận phiên bản mới nhất trước khi tiếp tục sử dụng nền tảng.',
    },
  ],
};

// Văn bản: CHÍNH SÁCH BẢO MẬT
export const PRIVACY_POLICY: LegalDoc = {
  title: 'CHÍNH SÁCH BẢO MẬT',
  version: PRIVACY_VERSION,
  intro:
    'Chính sách bảo mật mô tả cách Nền tảng thu thập, lưu trữ, xử lý và bảo vệ thông tin của người dùng.',
  sections: [
    {
      heading: '1. Giới thiệu',
      body: 'Chính sách này mô tả cách Nền tảng thu thập, lưu trữ, xử lý và bảo vệ thông tin của người dùng.',
    },
    {
      heading: '2. Thông tin được thu thập',
      body: 'Nền tảng có thể thu thập các thông tin sau:',
      subSections: [
        {
          heading: 'Thông tin cá nhân',
          bullets: ['Họ và tên', 'Địa chỉ email', 'Số điện thoại'],
        },
        {
          heading: 'Thông tin hộ kinh doanh',
          bullets: ['Tên hộ kinh doanh', 'Mã số thuế', 'Địa chỉ kinh doanh', 'Người đại diện'],
        },
        {
          heading: 'Dữ liệu hoạt động kinh doanh',
          bullets: ['Danh mục sản phẩm', 'Hàng tồn kho', 'Doanh thu', 'Đơn hàng', 'Khách hàng', 'Công nợ'],
        },
        {
          heading: 'Thông tin kỹ thuật',
          bullets: ['Lịch sử đăng nhập', 'Địa chỉ IP', 'Trình duyệt', 'Thiết bị truy cập', 'Thông tin phiên đăng nhập (JWT)'],
        },
      ],
    },
    {
      heading: '3. Mục đích sử dụng dữ liệu',
      body: 'Thông tin được thu thập nhằm:',
      bullets: [
        'Xác thực người dùng.',
        'Quản lý tài khoản.',
        'Quản lý hoạt động kinh doanh.',
        'Quản lý kho.',
        'Quản lý bán hàng.',
        'Quản lý khách hàng.',
        'Thống kê và báo cáo.',
        'Hỗ trợ AI.',
        'Hỗ trợ ghi sổ kế toán.',
        'Bảo vệ an toàn hệ thống.',
        'Phát hiện và ngăn chặn hành vi gian lận.',
      ],
    },
    {
      heading: '4. Hỗ trợ theo Thông tư 88/2021/TT-BTC',
      body:
        'Thông tin kinh doanh của người dùng có thể được sử dụng để hỗ trợ việc lập sổ kế toán theo Thông tư số 88/2021/TT-BTC của Bộ Tài chính. Nền tảng có thể hỗ trợ tạo các sổ sau:',
      bullets: [
        'S1-HKD – Sổ doanh thu.',
        'S2-HKD – Sổ vật liệu, hàng hóa.',
        'S4-HKD – Sổ theo dõi nghĩa vụ thuế.',
      ],
    },
    {
      heading: '5. Bảo vệ dữ liệu',
      body: 'Nền tảng áp dụng các biện pháp bảo mật như:',
      bullets: [
        'Mã hóa mật khẩu.',
        'Xác thực bằng JWT.',
        'Phân quyền theo vai trò (RBAC).',
        'Giao tiếp an toàn qua HTTPS.',
        'Kiểm soát truy cập cơ sở dữ liệu.',
        'Ghi nhật ký hoạt động (Audit Log).',
        'Kiểm tra và xác thực dữ liệu đầu vào.',
      ],
    },
    {
      heading: '6. Chia sẻ thông tin',
      body:
        'Nền tảng không bán, trao đổi hoặc cung cấp thông tin cá nhân của người dùng cho bên thứ ba vì mục đích thương mại. Thông tin chỉ được chia sẻ trong các trường hợp:',
      bullets: [
        'Theo yêu cầu của cơ quan nhà nước có thẩm quyền.',
        'Theo quy định của pháp luật.',
        'Phục vụ cho việc vận hành hệ thống.',
      ],
    },
    {
      heading: '7. Lưu trữ dữ liệu',
      body:
        'Thông tin được lưu trữ trong suốt thời gian tài khoản còn hoạt động hoặc theo thời hạn mà pháp luật quy định. Các bản ghi về việc người dùng chấp thuận Điều khoản sử dụng và Chính sách bảo mật được lưu giữ để phục vụ mục đích đối chiếu và kiểm tra khi cần thiết.',
    },
    {
      heading: '8. Quyền của người dùng',
      body: 'Người dùng có quyền:',
      bullets: [
        'Xem thông tin tài khoản.',
        'Cập nhật thông tin hộ kinh doanh.',
        'Đổi mật khẩu.',
        'Xem lịch sử chấp thuận Điều khoản và Chính sách bảo mật.',
        'Yêu cầu xóa tài khoản theo quy định của hệ thống và pháp luật.',
      ],
    },
    {
      heading: '9. Sự đồng ý của người dùng',
      body:
        'Khi đồng ý với Chính sách bảo mật, người dùng xác nhận cho phép Nền tảng thu thập và xử lý dữ liệu theo các mục đích đã nêu.',
    },
  ],
};

// Văn bản: THÔNG BÁO VỀ THÔNG TƯ 88/2021/TT-BTC
export const CIRCULAR_88_NOTICE: LegalDoc = {
  title: 'THÔNG BÁO VỀ THÔNG TƯ 88/2021/TT-BTC',
  intro:
    'Để hỗ trợ hộ kinh doanh trong quá trình chuyển đổi số, Nền tảng lưu trữ và xử lý các thông tin kinh doanh do người dùng cung cấp.',
  sections: [
    {
      heading: 'Sổ kế toán được hỗ trợ',
      body:
        'Các dữ liệu này có thể được sử dụng để hỗ trợ lập sổ kế toán theo Thông tư số 88/2021/TT-BTC của Bộ Tài chính, bao gồm:',
      bullets: [
        'S1-HKD – Sổ doanh thu.',
        'S2-HKD – Sổ vật liệu, hàng hóa.',
        'S4-HKD – Sổ theo dõi nghĩa vụ thuế.',
      ],
    },
    {
      heading: 'Trách nhiệm của chủ hộ kinh doanh',
      body:
        'Nền tảng chỉ đóng vai trò là công cụ hỗ trợ quản lý và ghi sổ kế toán. Chủ hộ kinh doanh chịu trách nhiệm trước pháp luật về tính trung thực, đầy đủ và chính xác của các thông tin đã cung cấp cũng như việc tuân thủ các quy định hiện hành.',
    },
  ],
};

/** Map các tài liệu pháp lý theo khóa. */
export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  terms: TERMS_OF_USE,
  privacy: PRIVACY_POLICY,
  circular88: CIRCULAR_88_NOTICE,
};
