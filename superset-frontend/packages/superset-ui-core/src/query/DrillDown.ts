/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { JsonObject } from '@superset-ui/core';
import {
  QueryObjectFilterClause,
  QueryFormColumn,
  DrillDownType
} from './types';
import { ensureIsArray } from '../utils';

export default class DrillDown {
  static fromHierarchy(hierarchy: QueryFormColumn[]): DrillDownType {
    hierarchy = ensureIsArray(hierarchy);
    return {
      drilldown: {
        { hierarchy },
        currentIdx: hierarchy.length > 0 ? 0 : -1,
        filters: [],
      },
    };
  }

  static drillDown(value: DrillDownType, selectValue: string): DrillDownType {
    const idx = value.currentIdx;
    const len = value.hierarchy.length;

    if (idx + 1 >= len) {
      return {
        drilldown: {
          hierarchy: value.hierarchy,
          currentIdx: 0,
          filters: [],
        },
      };
    }
    return {
      drilldown: {
        hierarchy: value.hierarchy,
        currentIdx: idx + 1,
        filters: value.filters.concat({
          col: value.hierarchy[idx],
          op: 'IN',
          val: [selectValue],
        }),
      },
    };
  }

  static rollUp(value: DrillDownType): DrillDownType {
    const idx = value.currentIdx;
    const len = value.hierarchy.length;
    return {
      drilldown: {
        hierarchy: value.hierarchy,
        currentIdx: idx - 1 < 0 ? len - 1 : idx - 1,
        filters: value.filters.slice(0, -1),
      },
    };
  }

  static getColumn(
    value: DrillDownType | JsonObject,
    hierarchy: QueryFormColumn[],
  ): string {
    if (value) {
      return value.hierarchy[value.currentIdx];
    }
    const val = DrillDown.fromHierarchy(hierarchy);
    return val.hierarchy[val.currentIdx];
  }

  static getFilters(
    value: DrillDownType | JsonObject,
    hierarchy: QueryFormColumn[],
  ): QueryObjectFilterClause[] {
    if (value) {
      return value.filters;
    }
    const val = DrillDown.fromHierarchy(hierarchy);
    return val.filters;
  }
}
