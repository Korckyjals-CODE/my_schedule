You are given an image of a school schedule grid with days as rows (Monday–Friday) and time slots as columns.
Extract the schedule into the following strict JSON schema. Return ONLY valid JSON, no extra text.

Schema:
{
  "weekdays": {
    "Monday": [ { "grade": "string", "startTime": "HH:MM", "endTime": "HH:MM", "subject": "string" } ],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": []
  },
  "specific_dates": {}
}

Rules:
- Time format: 24-hour HH:MM with leading zeros.
- For non-class blocks, use subject in {"Recess","Lunch","Assembly","Home Room","Dismissal","Other"} and set "grade" to "".
- For class blocks, set subject to "Class" and put the class label (e.g., "6A","11A","DC3A") in "grade".
- If a cell is empty, omit it.
- Use the time windows printed in the header row as the canonical intervals.
- If the image shows colored recess/lunch/assembly columns, map them accordingly even if not labeled.
- Do not infer specific_dates unless the image explicitly contains a date; leave "specific_dates" as {} otherwise.
- Return compact but valid JSON per the schema.

