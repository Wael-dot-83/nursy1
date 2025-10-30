import '@testing-library/jest-dom';

class ResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

if (!global.ResizeObserver) {
  global.ResizeObserver = ResizeObserver;
}
