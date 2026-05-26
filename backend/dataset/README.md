# LangDad Arabic Learning Dataset

**Export date:** 2026-05-25
**Language:** Arabic (Modern Standard Arabic)
**Platform:** LangDad (https://langdad.com)
**License:** CC BY-NC-SA 4.0

## Description

This dataset contains anonymized learning interactions from the LangDad Arabic learning platform.
It covers Degree 1, Module 1: Arabic alphabet, short vowels (harakat), long vowels, tanwin, letter positions, basic vocabulary and sentences.

## Files

| File | Description | Rows |
|------|-------------|------|
| interactions.csv | Learning interactions (main file) | 1892 |
| students.csv | Anonymized student profiles | 5 |
| exercises.csv | Exercise metadata | 193 |
| skills.csv | Skills taxonomy | 10 |

## Interactions Schema

| Column | Type | Description |
|--------|------|-------------|
| interaction_id | string | Unique interaction ID |
| student_id | string | Anonymized student ID (SHA256) |
| timestamp | datetime | UTC timestamp |
| lesson_id | int | Lesson ID |
| exercise_id | string | Exercise ID |
| skill_id | string | Knowledge component (skill) |
| exercise_type | string | Type of exercise |
| variant | int | Difficulty variant (1-4) |
| correct | int | 1 = correct, 0 = incorrect |
| response_time_ms | int | Response time in milliseconds |
| hint_used | int | 1 = hint used |
| attempt | int | Attempt number |
| lesson_type | string | Type of lesson |
| module_id | int | Module ID |

## Skills

| skill_id | Description |
|----------|-------------|
| letter_recognition | Identify Arabic letters م ك ت ب |
| harakat_reading | Read short vowels (fatha, kasra, damma) |
| long_vowels | Read long vowels ا و ي |
| tanwin | Read tanwin (nunation) |
| letter_positions | Identify letter forms (isolated, initial, medial, final) |
| word_reading | Read simple Arabic words |
| word_comprehension | Understand Arabic word meanings |
| word_writing | Write Arabic words |
| word_building | Construct words from letters |
| sentence_reading | Read and understand simple sentences |

## Exercise Types

| type | description |
|------|-------------|
| mcq | Multiple Choice Question |
| audio_choice | Audio-based Multiple Choice |
| input_text | Text Input |
| drag_drop | Drag and Drop |
| word_order | Word Ordering |
| matching | Text Matching |
| matching_image_word | Image-Word Matching |
| matching_text_audio | Text-Audio Matching |
| drawing | Letter Drawing |
| oral_reading | Oral Reading |

## Privacy

All student identifiers have been anonymized using SHA256 hashing with a salt.
No personally identifiable information (PII) is included in this dataset.

## Citation

If you use this dataset in your research, please cite:
```
@dataset{langdad2026,
  title     = {LangDad Arabic Learning Dataset},
  author    = {LangDad},
  year      = {2026},
  url       = {https://langdad.com},
  license   = {CC BY-NC-SA 4.0}
}
```

## Contact

contact@langdad.com
