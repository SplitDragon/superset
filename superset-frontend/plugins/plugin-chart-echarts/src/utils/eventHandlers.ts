/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  BinaryQueryObjectFilterClause,
  ContextMenuFilters,
  DataMask,
  QueryFormColumn,
  JsonObject,
} from '@superset-ui/core';
import {
  BaseTransformedProps,
  CrossFilterTransformedProps,
  EventHandlers,
} from '../types';

export type Event = {
  name: string;
  event: { stop: () => void; event: PointerEvent };
};

const getCrossFilterDataMask =
  (
    selectedValues: Record<number, string>,
    groupby: QueryFormColumn[],
    labelMap: Record<string, string[]>,
  ) =>
  (value: string) => {
    const selected = Object.values(selectedValues);
    let values: string[];
    if (selected.includes(value)) {
      values = selected.filter(v => v !== value);
    } else {
      values = [value];
    }

    const groupbyValues = values.map(value => labelMap[value]);

    return {
      dataMask: {
        extraFormData: {
          filters:
            values.length === 0
              ? []
              : groupby.map((col, idx) => {
                  const val = groupbyValues.map(v => v[idx]);
                  if (val === null || val === undefined)
                    return {
                      col,
                      op: 'IS NULL' as const,
                    };
                  return {
                    col,
                    op: 'IN' as const,
                    val: val as (string | number | boolean)[],
                  };
                }),
        },
        filterState: {
          value: groupbyValues.length ? groupbyValues : null,
          selectedValues: values.length ? values : null,
        },
      },
      isCurrentValueSelected: selected.includes(value),
    };
  };

export const clickEventHandler =
  (
    getCrossFilterDataMask: (
      value: string,
    ) => ContextMenuFilters['crossFilter'],
    setDataMask: (dataMask: DataMask) => void,
    emitCrossFilters?: boolean,
    formData: F,
    ownState?: JsonObject,
  ) =>
  ({ name }: { name: string }) => {
    if (!emitCrossFilters && !formData.drillDown) {
      return;
    }

    let dataMask = getCrossFilterDataMask(name)?.dataMask;

    if (formData.drillDown && ownState?.drilldown) {
      const drilldown = DrillDown.drillDown(ownState?.drilldown, values[0]);
      dataMask = {
        extraFormData: {
          filters: drilldown.filters,
        },
        filterState: {
          value:
            groupbyValues.length && drilldown.filters.length > 0
              ? groupbyValues
              : null,
        },
        ownState: {
          drilldown,
        },
      };
    }
    if (dataMask) {
      setDataMask(dataMask);
    }
  };

export const contextMenuEventHandler =
  (
    groupby: (BaseTransformedProps<any> &
      CrossFilterTransformedProps)['groupby'],
    onContextMenu: BaseTransformedProps<any>['onContextMenu'],
    labelMap: Record<string, string[]>,
    getCrossFilterDataMask: (
      value: string,
    ) => ContextMenuFilters['crossFilter'],
  ) =>
  (e: Event) => {
    if (onContextMenu) {
      e.event.stop();
      const pointerEvent = e.event.event;
      const drillToDetailFilters: BinaryQueryObjectFilterClause[] = [];
      if (groupby.length > 0) {
        const values = labelMap[e.name];
        groupby.forEach((dimension, i) =>
          drillToDetailFilters.push({
            col: dimension,
            op: '==',
            val: values[i],
            formattedVal: String(values[i]),
          }),
        );
      }
      onContextMenu(pointerEvent.clientX, pointerEvent.clientY, {
        drillToDetail: drillToDetailFilters,
        crossFilter: getCrossFilterDataMask(e.name),
      });
    }
  };

export const allEventHandlers = (
  transformedProps: BaseTransformedProps<any> & CrossFilterTransformedProps,
) => {
  const {
    formData,
    groupby,
    onContextMenu,
    setDataMask,
    labelMap,
    emitCrossFilters,
    selectedValues,
    ownState,
  } = transformedProps;
  const eventHandlers: EventHandlers = {
    click: clickEventHandler(
      getCrossFilterDataMask(selectedValues, groupby, labelMap),
      setDataMask,
      emitCrossFilters,
      formData,
      ownState,
    ),
    contextmenu: contextMenuEventHandler(
      groupby,
      onContextMenu,
      labelMap,
      getCrossFilterDataMask(selectedValues, groupby, labelMap),
    ),
  };
  return eventHandlers;
};
