from app.schemas.course import ModuleCreate, ModuleResponse, LessonCreate, LessonResponse


def test_module_and_lesson_schemas_validate_expected_fields():
    module_payload = ModuleCreate(title="Introduction", position=1)
    lesson_payload = LessonCreate(title="Welcome lesson", content="Hello", position=1, duration_min=10, is_preview=True)

    assert module_payload.title == "Introduction"
    assert lesson_payload.duration_min == 10


def test_module_and_lesson_responses_support_model_validation():
    module_response = ModuleResponse(id="11111111-1111-1111-1111-111111111111", course_id="22222222-2222-2222-2222-222222222222", title="Introduction", position=1, lessons=[])
    lesson_response = LessonResponse(id="33333333-3333-3333-3333-333333333333", module_id="11111111-1111-1111-1111-111111111111", title="Welcome lesson", content="Hello", position=1, duration_min=10, is_preview=True)

    assert module_response.title == "Introduction"
    assert lesson_response.is_preview is True
