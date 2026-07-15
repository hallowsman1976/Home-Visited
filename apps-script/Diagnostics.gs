function diagnostics_(auth){
  if(['SUPER_ADMIN','ORG_ADMIN'].indexOf(String(auth.user.role_code))===-1)throw createAppError_('FORBIDDEN','เฉพาะผู้ดูแลระบบ');
  const config=getRuntimeConfig_();
  const errText=function(e){return String(e&&e.message?e.message:e);};
  let readiness;try{readiness=productionReadinessCheck();}catch(e){readiness={ready:false,checks:[{name:'readiness',ok:false,detail:errText(e)}]};}
  let schema;try{schema=validateSystemSchema();}catch(e){schema=[];readiness.checks.push({name:'schema',ok:false,detail:errText(e)});}
  let integrity;try{integrity=verifyDataIntegrity();}catch(e){integrity={ok:false,issues:[],totalIssues:0};readiness.ready=false;readiness.checks.push({name:'integrity',ok:false,detail:errText(e)});}
  let triggers;try{triggers=ScriptApp.getProjectTriggers().map(function(t){return{handler:t.getHandlerFunction(),type:String(t.getEventType())};});}catch(e){triggers=[];}
  return{service:config.appName,version:config.version,environment:config.environment,readiness:readiness,schema:schema,integrity:integrity,triggers:triggers,checkedAt:new Date().toISOString()};
}
