/* */ 
"use strict";var _,merge;merge=require("merge"),_=require("lodash"),module.exports=function(e){return _.isObject(e)&&!_.isArray(e)?e:1===e.length?e[0]:merge.recursive.apply(this,e)};