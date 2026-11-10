import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BrandMark from '../components/ui/BrandMark';
import Timbre from '../components/ui/Timbre';

describe('marca: el timbre', () => {
  afterEach(cleanup);

  it('la marca horizontal lee el nombre una sola vez y el símbolo no se anuncia', () => {
    const { container } = render(<BrandMark />);
    expect(screen.getByText("Kike's")).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('el símbolo solo se anuncia con su título y pierde la K en la versión reducida', () => {
    const { container, rerender } = render(<Timbre title="Kike's" />);
    expect(screen.getByRole('img', { name: "Kike's" })).toBeInTheDocument();
    expect(container.querySelectorAll('path')).toHaveLength(2);
    rerender(<Timbre title="Kike's" withK={false} />);
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });
});
