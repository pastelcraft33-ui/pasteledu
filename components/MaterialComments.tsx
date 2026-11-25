"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Row = { id: string; material_id: string; body: string; created_at: string };
export default function MaterialComments({ materialId, materials }: { materialId?: string; materials?: {id: string; title: string}[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [version, refresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    let q = supabase.from("material_comments").select("*").order("created_at", {ascending:false}).order("id").limit(limit+1);
    if (materialId) q = q.eq("material_id", materialId);
    q.then(({data,error}) => {
      if (!active) return;
      setRows(data ?? []);
      setMessage(error ? "댓글을 불러오지 못했습니다." : "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [materialId, limit, version]);

  async function change(id?: string) {
    if (busy || (id ? !window.confirm("이 댓글을 삭제할까요?") : !materialId || !draft.trim())) return;
    setBusy(true);
    try {
      const result = id ? await supabase.from("material_comments").delete().eq("id", id).select("id").single()
        : await supabase.from("material_comments").insert({material_id:materialId, body:draft.trim()});
      if (result.error) throw result.error;
      if (!id) setDraft("");
      refresh(n => n+1);
    } catch { setMessage("댓글 처리에 실패했습니다. 다시 시도해주세요."); }
    finally { setBusy(false); }
  }
  return <section className="mt-5 space-y-3 border-t pt-4">
    <h3 className="font-bold">{materialId ? "익명 댓글" : "댓글 관리"}</h3>
    {materialId && <form className="space-y-2" onSubmit={e=>{e.preventDefault(); void change();}}>
      <textarea aria-label="익명 댓글" placeholder="댓글을 남겨주세요 (최대 500자)" className="w-full rounded border p-2" maxLength={500} value={draft} onChange={e=>setDraft(e.target.value)} />
      <button disabled={busy || !draft.trim()} className="rounded bg-gray-800 px-3 py-2 text-sm text-white disabled:opacity-50">댓글 등록</button>
    </form>}
    {message && <p role="alert">{message}</p>}
    {loading ? <p>댓글을 불러오는 중입니다.</p> : !message && !rows.length && <p>등록된 댓글이 없습니다.</p>}
    {rows.slice(0,limit).map(r=><article key={r.id} className="border-t py-2">
      <strong>{materialId ? "익명" : materials?.find(m=>m.id===r.material_id)?.title ?? "PPT 자료"}</strong>
      <small className="ml-2">{new Date(r.created_at).toLocaleDateString("ko-KR")}</small>
      <p className="whitespace-pre-wrap break-all">{r.body}</p>
      {!materialId && <button disabled={busy} className="text-sm text-red-700" onClick={()=>void change(r.id)}>삭제</button>}
    </article>)}
    {rows.length>limit && <button onClick={()=>setLimit(n=>n+20)}>댓글 더보기</button>}
  </section>;
}
