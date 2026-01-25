// Calculator Registry
// Register all calculators here

const CalculatorRegistry = {
  calculators: {},
  
  // Register a calculator
  register(calculator) {
    if (!calculator.type) {
      console.error('Calculator must have a type property');
      return;
    }
    this.calculators[calculator.type] = calculator;
  },
  
  // Get a calculator by type
  get(type) {
    return this.calculators[type];
  },
  
  // Get all registered calculators
  getAll() {
    return this.calculators;
  },
  
  // Check if a calculator exists
  has(type) {
    return type in this.calculators;
  }
};

