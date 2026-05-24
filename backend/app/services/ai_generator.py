import json
from typing import List
from groq import Groq
from app.config import settings
from app.models import NoteSection, QuizQuestion, QuizOption


class AIGeneratorService:
    """
    Handles AI-powered content generation.

    Uses Groq with Llama 3 models.
    """

    def __init__(self):
        if settings.groq_api_key:
            self.client = Groq(api_key=settings.groq_api_key)
        else:
            self.client = None


    async def generate_notes(self, transcript: str, output_language: str = "English") -> List[NoteSection]:

        if not self.client:
            raise Exception("Groq API key not configured. Add GROQ_API_KEY to .env")

        prompt = f"""
You are an expert AI tutor writing comprehensive, exam-ready study notes for a college student.

Convert the lecture transcript into FULL structured study notes — not a summary.
The student should be able to study from these notes alone without re-watching the lecture.

IMPORTANT:
- Detect the language of the transcript.
- Translate final notes into {output_language}.
- Use simple, clear language a student can understand.
- Be thorough: include definitions, formulas (in plain text), key terms, worked examples,
  and the reasoning behind each concept — not just bullet headlines.
- Each bullet should be a complete, self-contained sentence or two — never a one-word fragment.
- Preserve every important fact, example, name, date, formula or analogy from the lecture.

STRUCTURE:
1. First section: "Lecture Overview" — 4 to 6 bullets describing what the lecture covers,
   why it matters, and prerequisites the student should already know.
2. Then 4 to 8 topic sections covering the lecture in logical order. Section titles should
   describe the actual concept (e.g. "Backpropagation Algorithm"), not generic ("Topic 2").
3. Each topic section must contain 6 to 10 detailed bullets including definitions,
   examples, formulas, and common pitfalls or misconceptions.
4. Optional section: "Worked Examples" with step-by-step problems if the lecture had any.
5. Final section: "Key Takeaways" — 5 to 8 bullets the student MUST remember for the exam.

LENGTH TARGET: roughly 600–1200 words total across all sections. Do not pad with filler —
add real content from the transcript.

TRANSCRIPT:
{transcript}

Respond ONLY with valid JSON in this exact format (no markdown, no comments):

{{
  "sections":[
    {{
      "title":"Section title",
      "content":["full sentence bullet 1","full sentence bullet 2","full sentence bullet 3"]
    }}
  ]
}}
"""

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=6000
        )

        content = response.choices[0].message.content.strip()

        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            json_str = content[start:end]

            result = json.loads(json_str)

        except Exception as e:
            print("JSON parsing failed for notes:", str(e))

            result = {
                "sections": [
                    {
                        "title": "Lecture Summary",
                        "content": [
                            "AI returned an invalid response format.",
                            "Transcript was processed but notes could not be parsed.",
                            "Try again with a shorter lecture."
                        ]
                    }
                ]
            }

        return [
            NoteSection(title=s["title"], content=s["content"])
            for s in result["sections"]
        ]


    async def generate_quiz(
        self,
        transcript: str,
        notes: List[NoteSection],
        output_language: str = "English",
        num_questions: int = 10
    ) -> List[QuizQuestion]:

        if not self.client:
            raise Exception("Groq API key not configured. Add GROQ_API_KEY to .env")

        notes_text = "\n".join([
            f"{s.title}:\n" + "\n".join(f"- {c}" for c in s.content)
            for s in notes
        ])

        prompt = f"""
You are an expert teacher creating quiz questions.

Create {num_questions} multiple choice questions based on the lecture.

RULES:
- Test understanding of key concepts
- 4 options per question
- Only ONE correct answer
- Include short explanation
- Translate quiz into {output_language}

LECTURE NOTES:
{notes_text}

TRANSCRIPT:
{transcript[:3000]}

Return ONLY valid JSON:

{{
"questions":[
  {{
    "id":1,
    "question":"Question text?",
    "options":[
      {{"id":"A","text":"Option A"}},
      {{"id":"B","text":"Option B"}},
      {{"id":"C","text":"Option C"}},
      {{"id":"D","text":"Option D"}}
    ],
    "correct_answer":"A",
    "explanation":"Explanation"
  }}
]
}}
"""

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=5000
        )

        content = response.choices[0].message.content.strip()

        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            json_str = content[start:end]

            result = json.loads(json_str)

        except Exception as e:
            print("JSON parsing failed for quiz:", str(e))

            result = {
                "questions": [
                    {
                        "id": 1,
                        "question": "Quiz generation failed",
                        "options": [
                            {"id": "A", "text": "Try again"},
                            {"id": "B", "text": "Processing issue"},
                            {"id": "C", "text": "Transcript too long"},
                            {"id": "D", "text": "AI returned invalid format"}
                        ],
                        "correct_answer": "A",
                        "explanation": "AI response could not be parsed."
                    }
                ]
            }

        return [
            QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=[QuizOption(**opt) for opt in q["options"]],
                correct_answer=q["correct_answer"],
                explanation=q["explanation"]
            )
            for q in result["questions"]
        ]


    async def summarize_for_tts(self, notes: List[NoteSection]) -> str:

        if not self.client:
            return self._notes_to_text(notes)

        notes_text = self._notes_to_text(notes)

        prompt = f"""
You are a friendly tutor explaining a lecture.

Convert the study notes into a natural spoken explanation.

Rules:
- Conversational tone
- Simple explanations
- Logical flow
- Suitable for text-to-speech narration
- About 300 words

NOTES:
{notes_text}
"""

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500
        )

        return response.choices[0].message.content


    def _notes_to_text(self, notes: List[NoteSection]) -> str:

        text_parts = []
        for section in notes:
            text_parts.append(f"{section.title}.")
            for point in section.content:
                text_parts.append(point)

        return " ".join(text_parts)