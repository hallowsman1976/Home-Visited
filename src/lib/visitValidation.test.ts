import {describe,expect,it} from 'vitest';import{calculateBmi,validateVitals}from'./visitValidation';
describe('visit clinical input helpers',()=>{it('calculates BMI',()=>expect(calculateBmi(60,160)).toBe(23.44));it('rejects impossible SpO2',()=>expect(validateVitals({spo2Percent:120}).spo2Percent).toBeTruthy());});
