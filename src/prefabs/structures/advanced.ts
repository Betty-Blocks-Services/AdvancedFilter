import { number, toggle, variable } from '@betty-blocks/component-sdk';

export const advanced = (value: string) => {
  return {
    polling: toggle('Polling?', {
      value: false,
    }),
    pollingInterval: number('Polling interval', {
      value: 0,
      configuration: {
        showOnDrop: false,
        condition: {
          comparator: 'EQ',
          option: 'polling',
          value: true,
          type: 'SHOW',
        }
      },
    }),
    dataComponentAttribute: variable('Test attribute', {
      value: [value],
    }),
  };
};
