import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LiftMarker, LiftMarkerProps } from '../../lib';
import { makeLift, makeLiftState } from './test-utils';

([
  'emergency',
  'fire',
  'human',
  'moving',
  'offLine',
  'onCurrentFloor',
  'unknown',
] as LiftMarkerProps['variant'][]).forEach((variant) => {
  it(`smoke test - ${variant}`, () => {
    render(
      <svg>
        <LiftMarker lift={makeLift()} liftState={makeLiftState()} variant={variant} />
      </svg>,
    );
  });
});

it('trigger onClick event', () => {
  const mockOnClick = jasmine.createSpy();
  const root = render(
    <svg>
      <LiftMarker
        lift={makeLift()}
        liftState={makeLiftState()}
        onClick={mockOnClick}
        data-testid="marker"
      />
    </svg>,
  );
  userEvent.click(root.getByTestId('marker'));
  expect(mockOnClick).toHaveBeenCalled();
});