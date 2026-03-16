import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

/**
 * Calculator component that provides basic arithmetic operations.
 *
 * Supports:
 * - Addition, subtraction, multiplication, division
 * - Decimal point input with duplicate-prevention
 * - Clear (C) and Backspace (⌫) controls
 * - Keyboard input mapping
 * - Division-by-zero error handling
 * - Display of current input and computed results
 */

// PUBLIC_INTERFACE
function App() {
  // displayValue: what is shown on the calculator screen
  const [displayValue, setDisplayValue] = useState('0');
  // firstOperand: the first number in a pending operation
  const [firstOperand, setFirstOperand] = useState(null);
  // operator: the pending operator string ('+', '-', '*', '/')
  const [operator, setOperator] = useState(null);
  // waitingForSecond: true after an operator is pressed, next digit starts fresh input
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  // errorState: true when a divide-by-zero or invalid-result error occurs
  const [errorState, setErrorState] = useState(false);
  // expression: the expression string shown above the main display
  const [expression, setExpression] = useState('');

  /**
   * Resets the calculator to its initial state.
   */
  // PUBLIC_INTERFACE
  const handleClear = useCallback(() => {
    setDisplayValue('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
    setErrorState(false);
    setExpression('');
  }, []);

  /**
   * Removes the last character from the current display value.
   * If only one character remains, resets to '0'.
   */
  // PUBLIC_INTERFACE
  const handleBackspace = useCallback(() => {
    if (errorState) {
      handleClear();
      return;
    }
    // Cannot backspace while waiting for second operand
    if (waitingForSecond) return;
    if (displayValue.length > 1) {
      setDisplayValue(displayValue.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  }, [displayValue, errorState, waitingForSecond, handleClear]);

  /**
   * Appends a digit (0-9) to the current display value.
   * @param {string} digit - The digit character to append.
   */
  // PUBLIC_INTERFACE
  const handleDigit = useCallback((digit) => {
    if (errorState) return;

    if (waitingForSecond) {
      setDisplayValue(digit === '0' ? '0' : digit);
      setWaitingForSecond(false);
    } else {
      // Replace leading '0' only for non-decimal scenarios
      if (displayValue === '0' && digit !== '.') {
        setDisplayValue(digit);
      } else {
        // Limit display length to 15 characters for readability
        if (displayValue.length < 15) {
          setDisplayValue(displayValue + digit);
        }
      }
    }
  }, [displayValue, errorState, waitingForSecond]);

  /**
   * Appends a decimal point to the current display value.
   * Prevents multiple decimal points in a single number.
   */
  // PUBLIC_INTERFACE
  const handleDecimal = useCallback(() => {
    if (errorState) return;

    if (waitingForSecond) {
      setDisplayValue('0.');
      setWaitingForSecond(false);
      return;
    }
    // Prevent multiple decimal points
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  }, [displayValue, errorState, waitingForSecond]);

  /**
   * Applies the current operator with the pending operands and returns the result.
   * Handles division-by-zero.
   * @param {number} a - The first operand.
   * @param {number} b - The second operand.
   * @param {string} op - The operator string.
   * @returns {{ result: number|null, error: boolean }}
   */
  const compute = useCallback((a, b, op) => {
    switch (op) {
      case '+':
        return { result: a + b, error: false };
      case '-':
        return { result: a - b, error: false };
      case '*':
        return { result: a * b, error: false };
      case '/':
        if (b === 0) {
          return { result: null, error: true };
        }
        return { result: a / b, error: false };
      default:
        return { result: b, error: false };
    }
  }, []);

  /**
   * Formats a numeric result for display.
   * Limits decimal precision and removes trailing zeros.
   * @param {number} value - The number to format.
   * @returns {string}
   */
  const formatResult = (value) => {
    if (Number.isInteger(value)) {
      return String(value);
    }
    // Limit to 10 decimal places, then strip trailing zeros
    const fixed = parseFloat(value.toFixed(10));
    return String(fixed);
  };

  /**
   * Handles pressing an arithmetic operator button.
   * If a pending operator exists, computes the intermediate result first.
   * @param {string} op - The operator character ('+', '-', '*', '/').
   */
  // PUBLIC_INTERFACE
  const handleOperator = useCallback((op) => {
    if (errorState) return;

    const currentValue = parseFloat(displayValue);

    if (firstOperand !== null && !waitingForSecond) {
      // Compute intermediate result
      const { result, error } = compute(firstOperand, currentValue, operator);
      if (error) {
        setDisplayValue('Error');
        setErrorState(true);
        setExpression('');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecond(false);
        return;
      }
      const formatted = formatResult(result);
      setDisplayValue(formatted);
      setExpression(formatted + ' ' + getOpSymbol(op));
      setFirstOperand(result);
    } else {
      setExpression(displayValue + ' ' + getOpSymbol(op));
      setFirstOperand(currentValue);
    }

    setOperator(op);
    setWaitingForSecond(true);
  }, [displayValue, errorState, firstOperand, waitingForSecond, operator, compute]);

  /**
   * Handles pressing the equals button.
   * Computes the final result of the pending operation.
   */
  // PUBLIC_INTERFACE
  const handleEquals = useCallback(() => {
    if (errorState) return;
    if (firstOperand === null || operator === null) return;
    if (waitingForSecond) return; // Nothing entered for second operand yet

    const currentValue = parseFloat(displayValue);
    const { result, error } = compute(firstOperand, currentValue, operator);

    if (error) {
      setExpression(expression + ' ' + displayValue + ' =');
      setDisplayValue('Error');
      setErrorState(true);
    } else {
      const formatted = formatResult(result);
      setExpression(expression + ' ' + displayValue + ' =');
      setDisplayValue(formatted);
    }

    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
  }, [displayValue, errorState, firstOperand, operator, waitingForSecond, expression, compute]);

  /**
   * Returns the display symbol for a given operator.
   * @param {string} op - Internal operator string.
   * @returns {string}
   */
  const getOpSymbol = (op) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default:  return op;
    }
  };

  /**
   * Keyboard event handler.
   * Maps keyboard keys to calculator actions.
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;

      if (key >= '0' && key <= '9') {
        handleDigit(key);
      } else if (key === '.') {
        handleDecimal();
      } else if (key === '+') {
        handleOperator('+');
      } else if (key === '-') {
        handleOperator('-');
      } else if (key === '*') {
        handleOperator('*');
      } else if (key === '/') {
        e.preventDefault(); // Prevent browser quick-find
        handleOperator('/');
      } else if (key === 'Enter' || key === '=') {
        handleEquals();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleBackspace, handleClear]);

  /**
   * Button definitions for the calculator grid.
   * Each button has: label (display), value (action key), type (category), span (column span).
   */
  const buttons = [
    { label: 'C',   value: 'clear',  type: 'action',    span: 1 },
    { label: '⌫',  value: 'back',   type: 'action',    span: 1 },
    { label: '%',   value: '%',      type: 'action',    span: 1 },
    { label: '÷',   value: '/',      type: 'operator',  span: 1 },

    { label: '7',   value: '7',      type: 'digit',     span: 1 },
    { label: '8',   value: '8',      type: 'digit',     span: 1 },
    { label: '9',   value: '9',      type: 'digit',     span: 1 },
    { label: '×',   value: '*',      type: 'operator',  span: 1 },

    { label: '4',   value: '4',      type: 'digit',     span: 1 },
    { label: '5',   value: '5',      type: 'digit',     span: 1 },
    { label: '6',   value: '6',      type: 'digit',     span: 1 },
    { label: '−',   value: '-',      type: 'operator',  span: 1 },

    { label: '1',   value: '1',      type: 'digit',     span: 1 },
    { label: '2',   value: '2',      type: 'digit',     span: 1 },
    { label: '3',   value: '3',      type: 'digit',     span: 1 },
    { label: '+',   value: '+',      type: 'operator',  span: 1 },

    { label: '0',   value: '0',      type: 'digit',     span: 2 },
    { label: '.',   value: '.',      type: 'digit',     span: 1 },
    { label: '=',   value: '=',      type: 'equals',    span: 1 },
  ];

  /**
   * Handles a button click event.
   * @param {{ value: string, type: string }} button
   */
  const handleButtonClick = (button) => {
    switch (button.type) {
      case 'digit':
        if (button.value === '.') {
          handleDecimal();
        } else {
          handleDigit(button.value);
        }
        break;
      case 'operator':
        handleOperator(button.value);
        break;
      case 'equals':
        handleEquals();
        break;
      case 'action':
        if (button.value === 'clear') handleClear();
        else if (button.value === 'back') handleBackspace();
        else if (button.value === '%') {
          // Percent: divide current display by 100
          if (!errorState) {
            const val = parseFloat(displayValue) / 100;
            setDisplayValue(formatResult(val));
          }
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="app-container">
      <div className="calculator" role="application" aria-label="Calculator">
        {/* Display area */}
        <div className="calculator-display">
          <div className="expression" aria-live="polite" aria-label="Expression">
            {expression || '\u00A0'}
          </div>
          <div
            className={`main-display ${errorState ? 'error' : ''}`}
            aria-live="assertive"
            aria-label="Display"
          >
            {displayValue}
          </div>
        </div>

        {/* Button grid */}
        <div className="calculator-buttons" role="group" aria-label="Calculator buttons">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              className={`calc-btn calc-btn--${btn.type}${btn.span > 1 ? ` calc-btn--span-${btn.span}` : ''}`}
              onClick={() => handleButtonClick(btn)}
              aria-label={btn.label}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
