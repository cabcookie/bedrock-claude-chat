import { describe, expect, it } from 'vitest';
import { convertMessageMapToArray } from '../MessageUtils';
import {
  MessageContentWithChildren,
  MessageMap,
} from '../../@types/conversation';

describe('convertMessageMapToArray', () => {
  it('Only 1 item', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: [],
        sibling: ['1'],
      },
    ];
    const actual = convertMessageMapToArray(data, '1');
    expect(actual).toEqual(expected);
  });

  it('Simple parent-child relationship: 2 items', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2'],
      },
      '2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2',
        },
        parent: '1',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2'],
        sibling: ['1'],
      },
      {
        id: '2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2',
          contentType: 'text',
        },
        parent: '1',
        children: [],
        sibling: ['2'],
      },
    ];
    const actual = convertMessageMapToArray(data, '2');
    expect(actual).toEqual(expected);
  });

  it('Simple parent-child relationship: 3 items', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2'],
      },
      '2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2',
        },
        parent: '1',
        children: ['3'],
      },
      '3': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-3',
        },
        parent: '2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2'],
        sibling: ['1'],
      },
      {
        id: '2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2',
          contentType: 'text',
        },
        parent: '1',
        children: ['3'],
        sibling: ['2'],
      },
      {
        id: '3',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-3',
          contentType: 'text',
        },
        parent: '2',
        children: [],
        sibling: ['3'],
      },
    ];
    const actual = convertMessageMapToArray(data, '3');
    expect(actual).toEqual(expected);
  });

  it('Multiple children: Simple branch: Select 1st item', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2-1', '2-2'],
      },
      '2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-1',
        },
        parent: '1',
        children: [],
      },
      '2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2',
        },
        parent: '1',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2-1', '2-2'],
        sibling: ['1'],
      },
      {
        id: '2-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-1',
          contentType: 'text',
        },
        parent: '1',
        children: [],
        sibling: ['2-1', '2-2'],
      },
    ];
    const actual = convertMessageMapToArray(data, '2-1');
    expect(actual).toEqual(expected);
  });

  it('Multiple children: Simple branch: Select 2nd item', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2-1', '2-2'],
      },
      '2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-1',
        },
        parent: '1',
        children: [],
      },
      '2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2',
        },
        parent: '1',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2-1', '2-2'],
        sibling: ['1'],
      },
      {
        id: '2-2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2',
          contentType: 'text',
        },
        parent: '1',
        children: [],
        sibling: ['2-1', '2-2'],
      },
    ];
    const actual = convertMessageMapToArray(data, '2-2');
    expect(actual).toEqual(expected);
  });

  it('Multiple children: Conversation continues after branch: Select leaf node', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2-1', '2-2'],
      },
      '2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-1',
        },
        parent: '1',
        children: [],
      },
      '2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2',
        },
        parent: '1',
        children: ['2-2-1'],
      },
      '2-2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2-1',
        },
        parent: '2-2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2-1', '2-2'],
        sibling: ['1'],
      },
      {
        id: '2-2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2',
          contentType: 'text',
        },
        parent: '1',
        children: ['2-2-1'],
        sibling: ['2-1', '2-2'],
      },
      {
        id: '2-2-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2-1',
          contentType: 'text',
        },
        parent: '2-2',
        children: [],
        sibling: ['2-2-1'],
      },
    ];
    const actual = convertMessageMapToArray(data, '2-2-1');
    expect(actual).toEqual(expected);
  });

  it('Multiple children: Conversation continues after branch: Even if non-leaf node is selected, display till leaf node', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2-1', '2-2'],
      },
      '2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-1',
        },
        parent: '1',
        children: [],
      },
      '2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2',
        },
        parent: '1',
        children: ['2-2-1'],
      },
      '2-2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2-1',
        },
        parent: '2-2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2-1', '2-2'],
        sibling: ['1'],
      },
      {
        id: '2-2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2',
          contentType: 'text',
        },
        parent: '1',
        children: ['2-2-1'],
        sibling: ['2-1', '2-2'],
      },
      {
        id: '2-2-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2-1',
          contentType: 'text',
        },
        parent: '2-2',
        children: [],
        sibling: ['2-2-1'],
      },
    ];
    const actual = convertMessageMapToArray(data, '2-2');
    expect(actual).toEqual(expected);
  });

  it('Multiple branches: Elements under the selected element will be in a state where the 1st element is selected', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2-1', '2-2'],
      },
      '2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-1',
        },
        parent: '1',
        children: [],
      },
      '2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2',
        },
        parent: '1',
        children: ['2-2-1'],
      },
      '2-2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2-1',
        },
        parent: '2-2',
        children: ['2-2-2'],
      },
      '2-2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2-2',
        },
        parent: '2-2-1',
        children: ['2-2-2-1', '2-2-2-2'],
      },
      '2-2-2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2-2-1',
        },
        parent: '2-2-2',
        children: [],
      },
      '2-2-2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2-2-2',
        },
        parent: '2-2-2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2-1', '2-2'],
        sibling: ['1'],
      },
      {
        id: '2-2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2',
          contentType: 'text',
        },
        parent: '1',
        children: ['2-2-1'],
        sibling: ['2-1', '2-2'],
      },
      {
        id: '2-2-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2-1',
          contentType: 'text',
        },
        parent: '2-2',
        children: ['2-2-2'],
        sibling: ['2-2-1'],
      },
      {
        id: '2-2-2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2-2',
          contentType: 'text',
        },
        parent: '2-2-1',
        children: ['2-2-2-1', '2-2-2-2'],
        sibling: ['2-2-2'],
      },
      {
        id: '2-2-2-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-2-2-1',
          contentType: 'text',
        },
        parent: '2-2-2',
        children: [],
        sibling: ['2-2-2-1', '2-2-2-2'],
      },
    ];
    const actual = convertMessageMapToArray(data, '2-2');
    expect(actual).toEqual(expected);
  });

  it('system is excluded', () => {
    const data: MessageMap = {
      system: {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['1'],
      },
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: 'system',
        children: ['2'],
      },
      '2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2',
        },
        parent: '1',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: 'system',
        children: ['2'],
        sibling: ['1'],
      },
      {
        id: '2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2',
          contentType: 'text',
        },
        parent: '1',
        children: [],
        sibling: ['2'],
      },
    ];
    const actual = convertMessageMapToArray(data, '2');
    expect(actual).toEqual(expected);
  });

  it('system is excluded: Branch from 1st item: Select 1-1', () => {
    const data: MessageMap = {
      system: {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['1-1', '1-2'],
      },
      '1-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-1',
        },
        parent: 'system',
        children: ['1-1-1'],
      },
      '1-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-2',
        },
        parent: 'system',
        children: ['1-2-1'],
      },
      '1-1-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-1-1',
        },
        parent: '1-1',
        children: [],
      },
      '1-2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-2-1',
        },
        parent: '1-2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1-1',
          contentType: 'text',
        },
        parent: 'system',
        children: ['1-1-1'],
        sibling: ['1-1', '1-2'],
      },
      {
        id: '1-1-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1-1-1',
          contentType: 'text',
        },
        parent: '1-1',
        children: [],
        sibling: ['1-1-1'],
      },
    ];
    const actual = convertMessageMapToArray(data, '1-1');
    expect(actual).toEqual(expected);
  });

  it('system is excluded: Branch from 1st item: Select 1-2', () => {
    const data: MessageMap = {
      system: {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['1-1', '1-2'],
      },
      '1-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-1',
        },
        parent: 'system',
        children: ['1-1-1'],
      },
      '1-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-2',
        },
        parent: 'system',
        children: ['1-2-1'],
      },
      '1-1-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-1-1',
        },
        parent: '1-1',
        children: [],
      },
      '1-2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-2-1',
        },
        parent: '1-2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1-2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1-2',
          contentType: 'text',
        },
        parent: 'system',
        children: ['1-2-1'],
        sibling: ['1-1', '1-2'],
      },
      {
        id: '1-2-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1-2-1',
          contentType: 'text',
        },
        parent: '1-2',
        children: [],
        sibling: ['1-2-1'],
      },
    ];
    const actual = convertMessageMapToArray(data, '1-2');
    expect(actual).toEqual(expected);
  });

  it('system is excluded: Branch from 1st item: Select non-existent key', () => {
    const data: MessageMap = {
      system: {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['1-1', '1-2'],
      },
      '1-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-1',
        },
        parent: 'system',
        children: ['1-1-1'],
      },
      '1-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-2',
        },
        parent: 'system',
        children: ['1-2-1'],
      },
      '1-1-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-1-1',
        },
        parent: '1-1',
        children: [],
      },
      '1-2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1-2-1',
        },
        parent: '1-2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1-1',
          contentType: 'text',
        },
        parent: 'system',
        children: ['1-1-1'],
        sibling: ['1-1', '1-2'],
      },
      {
        id: '1-1-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1-1-1',
          contentType: 'text',
        },
        parent: '1-1',
        children: [],
        sibling: ['1-1-1'],
      },
    ];
    const actual = convertMessageMapToArray(data, '999');
    expect(actual).toEqual(expected);
  });

  it('Return empty array if there is no data in messageMap', () => {
    const data: MessageMap = {};

    const actual = convertMessageMapToArray(data, '1');
    expect(actual).toEqual([]);
  });

  it('If ID does not exist, show the first Child', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2-1', '2-2'],
      },
      '2-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-1',
        },
        parent: '1',
        children: ['3-1', '3-2'],
      },
      '2-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2-2',
        },
        parent: '1',
        children: [],
      },
      '3-1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-3-1',
        },
        parent: '2-1',
        children: [],
      },
      '3-2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-3-2',
        },
        parent: '2-1',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2-1', '2-2'],
        sibling: ['1'],
      },
      {
        id: '2-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2-1',
          contentType: 'text',
        },
        parent: '1',
        children: ['3-1', '3-2'],
        sibling: ['2-1', '2-2'],
      },
      {
        id: '3-1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-3-1',
          contentType: 'text',
        },
        parent: '2-1',
        children: [],
        sibling: ['3-1', '3-2'],
      },
    ];

    const actual = convertMessageMapToArray(data, '999');
    expect(actual).toEqual(expected);
  });

  it('If reference is cut midway, return array up to that point: Specified ID exists', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2'],
      },
      '2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2',
        },
        parent: 'dummy',
        children: ['3'],
      },
      '3': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-3',
        },
        parent: '2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2',
          contentType: 'text',
        },
        parent: null,
        children: ['3'],
        sibling: ['2'],
      },
      {
        id: '3',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-3',
          contentType: 'text',
        },
        parent: '2',
        children: [],
        sibling: ['3'],
      },
    ];

    const actual = convertMessageMapToArray(data, '3');
    expect(actual).toEqual(expected);
  });

  it('If reference is cut midway, return array up to that point: Specified ID does not exist', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2'],
      },
      '2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2',
        },
        parent: '1',
        children: ['4'],
      },
      '3': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-3',
        },
        parent: '2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2'],
        sibling: ['1'],
      },
      {
        id: '2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2',
          contentType: 'text',
        },
        parent: '1',
        children: [],
        sibling: ['2'],
      },
    ];

    const actual = convertMessageMapToArray(data, '9');
    expect(actual).toEqual(expected);
  });

  it('If there is a circular reference, interrupt: Specified ID exists', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['3'],
      },
      '2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2',
        },
        parent: '3',
        children: ['3'],
      },
      '3': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-3',
        },
        parent: '2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2',
          contentType: 'text',
        },
        parent: null,
        children: ['3'],
        sibling: ['2'],
      },
      {
        id: '3',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-3',
          contentType: 'text',
        },
        parent: '2',
        children: [],
        sibling: ['3'],
      },
    ];

    const actual = convertMessageMapToArray(data, '3');
    expect(actual).toEqual(expected);
  });

  it('If there is a circular reference, interrupt: Specified ID does not exist', () => {
    const data: MessageMap = {
      '1': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-1',
        },
        parent: null,
        children: ['2'],
      },
      '2': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-2',
        },
        parent: '1',
        children: ['1'],
      },
      '3': {
        role: 'user',
        model: 'claude-v2',
        content: {
          contentType: 'text',
          body: 'message-3',
        },
        parent: '2',
        children: [],
      },
    };
    const expected: MessageContentWithChildren[] = [
      {
        id: '1',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-1',
          contentType: 'text',
        },
        parent: null,
        children: ['2'],
        sibling: ['1'],
      },
      {
        id: '2',
        role: 'user',
        model: 'claude-v2',
        content: {
          body: 'message-2',
          contentType: 'text',
        },
        parent: '1',
        children: [],
        sibling: ['2'],
      },
    ];

    const actual = convertMessageMapToArray(data, '99');
    expect(actual).toEqual(expected);
  });
});
