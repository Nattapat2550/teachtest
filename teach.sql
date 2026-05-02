-- 1. ระบบสิทธิ์ผู้ใช้งาน (User Roles)
CREATE TABLE user_roles (
    user_id VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'student' -- ค่าเริ่มต้นเป็น student
);

-- 2. ระบบจัดการหลักสูตร (Courses)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    cover_image TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- โค้ดส่วนลดสำหรับหลักสูตร
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- เพลย์ลิสต์ (หมวดหมู่ในหลักสูตร)
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0
);

-- บทเรียน (คลิป, ไฟล์, ข้อสอบ)
CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) CHECK (item_type IN ('video', 'file', 'exam')),
    content_url TEXT, -- URL สำหรับ video หรือ file
    content_data TEXT, -- ข้อมูล JSON สำหรับ exam
    sort_order INT DEFAULT 0
);

-- 3. ระบบการซื้อและลงทะเบียน (Enrollments)
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL,
    promo_code_used VARCHAR(50),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id) -- ป้องกันการซื้อซ้ำ
);

-- 4. ระบบติดตามความคืบหน้า (Progress)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
    item_id UUID REFERENCES playlist_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, item_id)
);