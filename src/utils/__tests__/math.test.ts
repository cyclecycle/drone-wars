import { describe, it, expect } from 'vitest';
import { clamp, distance } from '../math';

describe('Math Utils', () => {
    describe('clamp', () => {
        it('should return value when within range', () => {
            expect(clamp(5, 0, 10)).toBe(5);
        });

        it('should return min when value < min', () => {
            expect(clamp(-5, 0, 10)).toBe(0);
        });

        it('should return max when value > max', () => {
            expect(clamp(15, 0, 10)).toBe(10);
        });
    });

    describe('distance', () => {
        it('should calculate distance correctly', () => {
            expect(distance(0, 0, 3, 4)).toBe(5);
        });

        it('should handle negative coordinates', () => {
            expect(distance(-1, -1, 2, 3)).toBe(5);
        });
    });
});
