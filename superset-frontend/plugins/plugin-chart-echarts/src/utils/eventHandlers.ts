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
  DrillDown,
  DrillDownType,
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
    formData?: JsonObject,
    ownState?: DrillDownType,
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
    let dataMask: DataMask;

    if (formData?.drillDown) {
      const drilldown = DrillDown.drillDown(ownState?, values[0]).drilldown;
      dataMask = {
        extraFormData: {
          filters: drilldown.filters,
        },
        filterState: {
          value: groupbyValues.length && drilldown.filters.length > 0 ? groupbyValues : null,
        },
        ownState: { drilldown },
      };
    } else {
      dataMask = {
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
      };
    }

    return {
      { dataMask },
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
    formData?: JsonObject,
  ) =>
  ({ name }: { name: string }) => {
    if (!emitCrossFilters && !formData?.drilldown) {
      return;
    }
    const dataMask = getCrossFilterDataMask(name)?.dataMask;
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
    groupby,
    onContextMenu,
    setDataMask,
    labelMap,
    emitCrossFilters,
    selectedValues,
    formData,
    ownState,
  } = transformedProps;
  const eventHandlers: EventHandlers = {
    click: clickEventHandler(
      getCrossFilterDataMask(
        selectedValues,
        groupby,
        labelMap,
        formData,
        ownState,
      ),
      setDataMask,
      emitCrossFilters,
      formData,
    ),
    contextmenu: contextMenuEventHandler(
      groupby,
      onContextMenu,
      labelMap,
      getCrossFilterDataMask(
        selectedValues,
        groupby,
        labelMap,
        formData,
        ownState,
      ),
    ),
  };
  return eventHandlers;
};
