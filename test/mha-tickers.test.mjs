import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTickerReader } from '../server/mha-tickers.mjs';
test('ticker cache deduplicates, filters bad pairs and retains results on error', async () => {
  let now = Date.now(), calls = 0, fail = false;
  const row = {coin_id:'magic-hash', market:{name:'Test'}, base:'MHA',target:'USDT',converted_last:{usd:1},converted_volume:{usd:20},timestamp:new Date(now).toISOString(),is_anomaly:false,is_stale:false,trade_url:'javascript:alert(1)'};
  const read = createTickerReader(async () => { calls++; if(fail) throw Error(); return {ok:true,json:async()=>({tickers:[row,{...row,is_stale:true},{...row,coin_id:'other'}]})}; },()=>now);
  const [a,b] = await Promise.all([read(),read()]);
  assert.equal(calls,1); assert.equal(a.data.rows.length,1); assert.equal(a.data.rows[0].url,null); assert.deepEqual(a,b);
  now+=59999; await read(); assert.equal(calls,1);
  now+=2; fail=true;
  const stale=await read(); assert.equal(calls,2); assert.equal(stale.status,'stale'); assert.equal(stale.data.rows.length,1);
});
test('unavailable upstream does not create zero values',async()=>{
  const read=createTickerReader(async()=>{throw Error();});
  assert.equal((await read()).data,null);
});
