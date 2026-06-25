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
  mode: "online" | "physical" | "private";
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  duration_weeks?: number;
  is_published: boolean;
  tutor?: CourseTutor;
  created_at: string;
}

export interface Enrollment {
  id: string;
  course: Course;
  mode: string;
  status: "pending" | "active" | "completed";
  progress?: number;
  enrolled_at: string;
}

export interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  position: number;
  duration_min?: number;
  is_preview: boolean;
  is_completed?: boolean;
}
