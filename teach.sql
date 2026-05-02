-- teachtest.sql
-- ==========================================
-- 1. ระบบจัดการสิทธิ์ผู้ใช้งาน (User Roles)
-- ==========================================
CREATE TABLE user_roles (
    user_id VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'student' -- กำหนดค่าเริ่มต้นเป็น student
);

-- ==========================================
-- 2. ระบบจัดการหลักสูตร (Courses & Playlists)
-- ==========================================

-- ตารางหลักสูตร (Courses)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id VARCHAR(255) NOT NULL, -- อ้างอิง ID ของติวเตอร์ที่สร้าง
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    cover_image TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตารางโค้ดส่วนลดสำหรับหลักสูตร (Promo Codes)
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, code) -- โค้ดในคอร์สเดียวกันห้ามซ้ำ
);

-- ตารางเพลย์ลิสต์ (หมวดหมู่ในหลักสูตร)
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0
);

-- ตารางบทเรียน (คลิป, ไฟล์, ข้อสอบ)
CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) CHECK (item_type IN ('video', 'file', 'exam')),
    content_url TEXT, -- URL สำหรับ video หรือ file
    content_data TEXT, -- ข้อมูล JSON หรือข้อความ สำหรับ exam
    sort_order INT DEFAULT 0
);

-- ==========================================
-- 3. ระบบการสั่งซื้อและการเรียน (Enrollments & Progress)
-- ==========================================

-- ตารางการลงทะเบียนเรียน (เมื่อนักเรียนซื้อคอร์ส)
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL, -- อ้างอิง ID ของนักเรียน
    price_paid DECIMAL(10, 2) NOT NULL, -- ราคาที่จ่ายจริง (หลังหักส่วนลด)
    promo_code_used VARCHAR(50),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id) -- ป้องกันการซื้อซ้ำในคอร์สเดียวกัน
);

-- ตารางเก็บความคืบหน้าการเรียน (Progress)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
    item_id UUID REFERENCES playlist_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, item_id) -- เก็บบันทึกแค่ 1 รายการต่อ 1 บทเรียนของการลงทะเบียนนั้น
);

-- ==========================================
-- 4. ระบบเนื้อหาทั่วไป (Content Management)
-- ==========================================

-- ตารางข่าวสาร/ประกาศ (News)
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตารางแบนเนอร์/สไลด์ (Carousel)
CREATE TABLE carousels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตารางคำร้องเรียน/อุทธรณ์ (Appeals)
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตารางเอกสารประกอบการสอนแบบสาธารณะ (Documents)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    gallery_urls TEXT DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. ข้อมูลเริ่มต้น (Initial Data)
-- ==========================================

INSERT INTO news (title, content, image_url) 
VALUES ('เปิดตัวระบบ LMS!', 'ยินดีต้อนรับเข้าสู่ระบบเรียนออนไลน์ TeachTest', '');