export default function autoThemeColor() {
  const accentColorList = [
    { primary: '#d40000ff', secondary: '#8b6060ff' },
    { primary: '#c6d400ff', secondary: '#8b8a60ff' },
    { primary: '#3cd400ff', secondary: '#678b60ff' },
    { primary: '#00bcd4',   secondary: '#607d8b' },
    { primary: '#0031d4ff', secondary: '#60688bff' },
    { primary: '#a200d4ff', secondary: '#8a608bff' }
  ];

  const randomAccent = accentColorList[Math.floor(Math.random() * accentColorList.length)];

  document.documentElement.style.setProperty('--color-primary', randomAccent.primary);
  document.documentElement.style.setProperty('--color-secondary', randomAccent.secondary);

  return function() {
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-secondary');
  };
}