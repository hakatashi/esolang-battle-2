import React from "react";
import { trpc } from "../utils/trpc";

export function SubmitTab({ contestId }: { contestId: number }) {
  const { data: languages, isLoading: isLoadingLangs } = trpc.getLanguages.useQuery();
  const { data: problems, isLoading: isLoadingProbs } = trpc.listProblems.useQuery({ contestId });
  const submitMutation = trpc.submitCode.useMutation();

  const [code, setCode] = React.useState("");
  const [selectedLanguageId, setSelectedLanguageId] = React.useState<string>("");
  const [selectedProblemId, setSelectedProblemId] = React.useState<string>("");
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguageId) {
      const searchParams = new URLSearchParams(window.location.search);
      const langIdParam = searchParams.get("languageId");
      setSelectedLanguageId(langIdParam || String(languages[0].id));
    }
  }, [languages, selectedLanguageId]);

  React.useEffect(() => {
    if (problems && problems.length > 0 && !selectedProblemId) {
      setSelectedProblemId(String(problems[0].id));
    }
  }, [problems, selectedProblemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    try {
      const submission = await submitMutation.mutateAsync({
        code,
        languageId: Number(selectedLanguageId),
        problemId: Number(selectedProblemId),
      });
      setSubmitMessage(`提出に成功しました (ID: ${submission.id})`);
      setCode("");
      
      // 提出一覧へ遷移
      if ((window as any).navigateToTab) {
        (window as any).navigateToTab("submissions");
      }
    } catch (e: any) {
      setSubmitMessage(`エラー: ${e.message}`);
    }
  };

  if (isLoadingLangs || isLoadingProbs) return <div>Loading...</div>;

  return (
    <form className="submit-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          問題:
          <select value={selectedProblemId} onChange={(e) => setSelectedProblemId(e.target.value)}>
            {problems?.map((p) => (
              <option key={p.id} value={p.id}>{p.title} (ID {p.id})</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          言語:
          <select value={selectedLanguageId} onChange={(e) => setSelectedLanguageId(e.target.value)}>
            {languages?.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          コード:
          <textarea rows={10} value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
      </div>
      <div className="form-row">
        <button type="submit" disabled={submitMutation.isLoading || !code.trim()}>
          {submitMutation.isLoading ? "提出中..." : "提出"}
        </button>
      </div>
      {submitMessage && <div className="submit-message">{submitMessage}</div>}
    </form>
  );
}
