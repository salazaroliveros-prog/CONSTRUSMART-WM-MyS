import '@testing-library/jest-dom'

// Habilita act() de React en entorno jsdom
// @ts-expect-error global para testing
globalThis.IS_REACT_ACT_ENVIRONMENT = true
