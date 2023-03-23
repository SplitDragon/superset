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
import { OwnState, JsonObject } from '@superset-ui/core';
import { QueryObjectFilterClause, QueryFormColumn } from './types';
import { ensureIsArray } from '../utils';

export default class DrillDown {
  static fromHierarchy(hierarchy: QueryFormColumn): OwnState {
    const arrHierarchy = ensureIsArray(hierarchy);
    return {
      drilldown: {
        hierarchy: arrHierarchy,
        currentIdx: hierarchy.length > 0 ? 0 : -1,
        filters: [],
      },
    };
  }

  static drillDown(value: OwnState, selectValue: string): OwnState {
    const val = value.dropdown;
    const idx = val.currentIdx;
    const len = val.hierarchy.length;

    if (idx + 1 >= len) {
      return {
        drilldown: {
          hierarchy: val.hierarchy,
          currentIdx: 0,
          filters: val.filters.concat({
            op: 'IS NOT NULL',
          }),
        },
      }
    }
    return {
      drilldown: {
        hierarchy: val.hierarchy,
        currentIdx: idx + 1,
        filters: val.filters.concat({
          col: val.hierarchy[idx],
          op: 'IN',
          val: [selectValue],
        }),
      },
    }
  }

  static rollUp(value: OwnState): OwnState {
    const val = value.dropdown;
    const idx = val.currentIdx;
    const len = val.hierarchy.length;
    return {
      drilldown: {
        hierarchy: val.hierarchy,
        currentIdx: idx - 1 < 0 ? len - 1 : idx - 1,
        filters: val.filters.slice(0, -1),
      },
    };
  }

  static getColumn(value: OwnState): OwnState {
    let val: JsonObject;
    if (value) {
      val = value.dropdown;
    } else {
      val = DrillDown.fromHierarchy([]);
    }
    return val.hierarchy[val.currentIdx];
  }

  static getFilters(
    value: OwnState,
    hierarchy: QueryFormColumn,
  ): QueryObjectFilterClause {
    let val: JsonObject;
    if (value) {
      val = value.dropdown;
    } else {
      val = DrillDown.fromHierarchy(...hierarchy);
    }
    return val.filters;
  }
}
