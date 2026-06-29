export interface CourseTutor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  price: number;
  mode: string;
  category?: string;
  level?: string;
  duration_weeks?: number;
  is_published: boolean;
  tutor?: CourseTutor;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id?: string;
  course_id?: string;
  course?: Course;
  mode: string;
  status: "pending" | "active" | "completed";
  progress?: number;
  enrolled_at: string;
  completed_at?: string;
}

export interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Material {
  id: string;
  title: string;
  type: string;
  s3_key: string;
  url: string;
  is_downloadable: boolean;
  size_bytes?: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  position: number;
  duration_min?: number;
  is_preview: boolean;
  is_completed?: boolean;
  materials?: Material[];
}

export interface LessonMaterial {
  id: string;
  title: string;
  type: string;
  s3_key: string;
  url: string;
  is_downloadable: boolean;
  size_bytes?: number;
  created_at: string;
}

export interface CourseMaterialResponse {
  lesson_id: string;
  lesson_title: string;
  materials: LessonMaterial[];
}

export interface StudentCourseProgress {
  student_id: string;
  student_name: string;
  enrollment_status: "pending" | "active" | "completed";
  progress_percent: number;
  lessons_completed: number;
  total_lessons: number;
  enrolled_at: string;
  completed_at?: string | null;
}

export interface StudentProgressResponse {
  student_id: string;
  student_name: string;
  progress: StudentCourseProgress[];
}
