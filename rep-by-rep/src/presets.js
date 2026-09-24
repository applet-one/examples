// Optional examples, not individualized treatment. Never import without the user's action.
export const presets = [
  {
    id: 'gentle-movement', title: 'Gentle movement', description: 'A short seated movement routine.',
    exercises: [
      { name: 'Shoulder rolls', instructions: 'Roll your shoulders slowly and comfortably. Stop if symptoms worsen.', target: 6, unit: 'reps', days: [1, 3, 5] },
      { name: 'Seated ankle circles', instructions: 'While seated, circle each ankle gently. Count each circle; adjust the target to your own plan.', target: 8, unit: 'reps', days: [1, 3, 5] },
    ],
  },
  {
    id: 'supported-strength', title: 'Supported strength', description: 'Simple movements with a stable support nearby.',
    exercises: [
      { name: 'Chair sit-to-stand', instructions: 'Use a stable chair and only perform this if your clinician has recommended it. Adjust or stop if uncomfortable.', target: 5, unit: 'reps', days: [2, 4] },
      { name: 'Supported heel raises', instructions: 'Hold a stable support and raise your heels slowly, only if this exercise is in your prescribed plan.', target: 8, unit: 'reps', days: [2, 4] },
    ],
  },
  {
    id: 'desk-reset', title: 'Desk reset', description: 'Two brief seated movement breaks.',
    exercises: [
      { name: 'Seated knee extensions', instructions: 'While seated, gently straighten one knee at a time. Follow your clinician’s range-of-motion advice.', target: 6, unit: 'reps', days: [1, 3, 5] },
      { name: 'Wrist circles', instructions: 'Circle your wrists gently within a comfortable range. Stop if symptoms worsen.', target: 8, unit: 'reps', days: [1, 3, 5] },
    ],
  },
];
