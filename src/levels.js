const levels = [
  {
    id: 'forest-cottage',
    name: '森林小屋',
    leftImage: 'assets/level1-left.png',
    rightImage: 'assets/level1-right.png',
    width: 640,
    height: 400,
    diffs: [
      { id: 'sun-face', x: 86, y: 72, radius: 34 },
      { id: 'roof-color', x: 320, y: 176, radius: 38 },
      { id: 'tree-apple', x: 505, y: 202, radius: 24 },
      { id: 'window-shape', x: 330, y: 224, radius: 22 },
      { id: 'flower-color', x: 145, y: 315, radius: 22 }
    ]
  },
  {
    id: 'ocean-friends',
    name: '海底朋友',
    leftImage: 'assets/level2-left.png',
    rightImage: 'assets/level2-right.png',
    width: 640,
    height: 400,
    diffs: [
      { id: 'fish-stripe', x: 220, y: 190, radius: 28 },
      { id: 'bubble-count', x: 410, y: 95, radius: 26 },
      { id: 'coral-color', x: 490, y: 305, radius: 34 },
      { id: 'shell-star', x: 124, y: 322, radius: 28 },
      { id: 'jelly-smile', x: 520, y: 150, radius: 32 }
    ]
  }
];

module.exports = levels;
