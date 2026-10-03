# ข้าวกล่อง · ส่งด่วนมื้อเที่ยง

แนวทางล่าสุด: ใช้สีส้มเป็นสีหลักบนพื้นขาวและพีชอ่อน ลดภาพประกอบ แบนเนอร์ และข้อความการตลาด ทางเข้าหลักมีเจ้าของร้านและไรเดอร์ ใช้ป้ายภาษาไทยที่อธิบายงานตรง ๆ เช่น รายการส่ง ลูกค้า แผนจัดส่ง ใช้ระยะห่างและขนาดช่องกรอกที่สม่ำเสมอ หลีกเลี่ยงการเอียงองค์ประกอบหรือวางปุ่มต่างระดับ

ส่วนแนวทางเริ่มต้นด้านล่างเก็บไว้เป็นประวัติการออกแบบ ให้ใช้แนวทางล่าสุดและ frontend/src/app/styles.css เมื่อมีข้อแตกต่าง

# ส่งสุข — visual and functional contract

Primary reference: the user-supplied orange/peach mockup. Preserve playful orange pattern headers, white round panels, dark maroon feature cards, tactile parcel illustrations and pill controls across customer, rider and owner screens.

Palette: orange #ff641c, peach #fff0e5, pink #ffe5e1, maroon #56160f, white #ffffff; warm dark body text and accessible muted neutrals. Thai font: Noto Sans Thai; Latin/numbers: Nunito. UI icons use tree-shaken Lucide components rather than improvised SVG paths. Custom shaded parcel/gift/document/scooter illustrations remain distinct from control icons.

Map: real OpenStreetMap tiles via Leaflet, geographic markers and backend road geometry. No fictional streets or simulated live rider marker. Solid lines = saved road geometry; dashed lines = straight-distance fallback, explicitly labeled. Public customer maps show only their origin/destination. ETA is the planned schedule. Maps support resize, fit all, keyboard zoom/pan, tile errors and fullscreen. Customer/shop coordinates can be selected by tapping the map.

Permissions: owner JWT for management; existing job-code permission for riders. Added customer tracking is a random order-scoped capability, independent of rider job codes. No public owner data, other recipients, phone/address text or private order notes. No customer booking/account endpoint is invented.

Responsive behavior: wide desktop sidebar and workspace, compact tablet rail, mobile bottom nav and single-column content. Mobile order tables become readable cards with persistent actions. Inputs and interactive controls have visible focus, safe-area padding, reduced-motion handling, and native keyboard-accessible dialogs.

Environment: actual local Express/MySQL by default. Demo UI is an explicitly selected separate mode; it never substitutes for a failed live request. Local data and credentials are excluded from Git. Business pricing and optimizer rules remain in the backend.
