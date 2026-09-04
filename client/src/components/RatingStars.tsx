import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  max = 5,
  size = 14,
  interactive = false,
  onChange,
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = rating >= starValue;
        const isHalf = !isFilled && rating >= starValue - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starValue)}
            style={{
              background: 'transparent', border: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: interactive ? 'pointer' : 'default',
              transition: 'transform 0.1s',
            }}
          >
            <Star
              size={size}
              style={{
                fill: isFilled ? 'var(--sb-warning, #B88A45)' : isHalf ? 'rgba(184,138,69,0.5)' : 'transparent',
                color: isFilled || isHalf ? 'var(--sb-warning, #B88A45)' : 'var(--sb-border-strong, #BEC9BA)',
              }}
            />
          </button>
        );
      })}
      <span style={{
        fontFamily: 'Work Sans, sans-serif',
        fontSize: 12, fontWeight: 600,
        color: 'var(--sb-warning, #B88A45)', marginLeft: 4,
      }}>
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
    </div>
  );
};
