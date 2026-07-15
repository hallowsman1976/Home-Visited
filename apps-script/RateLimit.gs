const RATE_LIMITS=Object.freeze({LOGIN_PER_10_MIN:20,AUTHENTICATED_PER_MIN:120,EXPORT_PER_HOUR:20,UPLOAD_PER_HOUR:30});
function enforceLoginRateLimit_(username){const key='rl:login:'+hashRateKey_(String(username||'unknown').toLowerCase())+':'+timeBucket_(600);incrementRateCounter_(key,RATE_LIMITS.LOGIN_PER_10_MIN,610);}
function enforceRequestRateLimit_(user,action){let seconds=60;let limit=RATE_LIMITS.AUTHENTICATED_PER_MIN;if(action==='reports.export'){seconds=3600;limit=RATE_LIMITS.EXPORT_PER_HOUR;}if(action==='attachments.upload'){seconds=3600;limit=RATE_LIMITS.UPLOAD_PER_HOUR;}const key='rl:'+action+':'+String(user.user_id)+':'+timeBucket_(seconds);incrementRateCounter_(key,limit,seconds+10);}
function incrementRateCounter_(key,limit,ttl){const cache=CacheService.getScriptCache();const lock=LockService.getScriptLock();lock.waitLock(5000);try{const current=Number(cache.get(key)||0)+1;if(current>limit)throw createAppError_('RATE_LIMITED','เรียกใช้งานถี่เกินกำหนด กรุณารอสักครู่');cache.put(key,String(current),Math.min(ttl,21600));}finally{lock.releaseLock();}}
function timeBucket_(seconds){return Math.floor(Date.now()/1000/seconds);}
function hashRateKey_(value){return bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8)).slice(0,24);}

