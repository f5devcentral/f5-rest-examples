/*
  Copyright (c) 2017, F5 Networks, Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  *
  http://www.apache.org/licenses/LICENSE-2.0
  *
  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
*/
/*
 * Copyright © 2016, F5 Networks, Inc. All rights reserved.
 * No part of this software may be reproduced or transmitted in any
 * form or by any means, electronic or mechanical, for any purpose,
 * without express written permission of F5 Networks, Inc.
 */
'use strict';

var MEMBERS = "/members";
var COMMON = "/~Common~";
var POOL_PATH = "/tm/ltm/pool";

module.exports = {
  POOL_PATH : POOL_PATH,
  COMMON : COMMON,
  MEMBERS : MEMBERS,
  LTM_NODE : "/tm/ltm/node/",
  MEMBERS_COMMON : MEMBERS + COMMON,
  POOL_PATH_COMMON : POOL_PATH + COMMON
};
