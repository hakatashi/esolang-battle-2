import React from "react";
import { trpc } from "../utils/trpc";

export function CodeTestTab({ contestId }: { contestId: number }) {
  void contestId; // contest 非依存だがインターフェイスを揃える

  const { data: languages, isLoading: isLoadingLanguages, error: languagesError } = trpc.getLanguages.useQuery();
  const testCodeMutation = trpc.testCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = React.useState<string>("");
  const [testCodeText, setTestCodeText] = React.useState("");

  React.useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguageId) {
      setSelectedLanguageId(String(languages[0].id));
    }
  }, [languages, selectedLanguageId]);

  async function handleRunTest(e: React.FormEvent) {
    e.preventDefault();
    try {
      const languageId = Number(selectedLanguageId);
      if (!Number.isFinite(languageId) || languageId <= 0) {
        throw new Error("languageId must be a positive number");
      }

      await testCodeMutation.mutateAsync({
        code: testCodeText,
        languageId,
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (isLoadingLanguages) {
    return <div>Loading languages...</div>;
  }

  if (languagesError) {
    return <div style={{ color: "#b00020" }}>Error: {languagesError.message}</div>;
  }

  if (!languages || languages.length === 0) {
    return <div>言語が定義されていません。</div>;
  }

  return (
    <form className="submit-form" onSubmit={handleRunTest}>
      <div className="form-row">
        <label>
          言語:
          <select
            value={selectedLanguageId}
            onChange={(e) => setSelectedLanguageId(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          コード (テスト用・提出されません):
          <textarea
            rows={10}
            value={testCodeText}
            onChange={(e) => setTestCodeText(e.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <button type="submit" disabled={testCodeMutation.isPending || !testCodeText.trim()}>
          {testCodeMutation.isPending ? "実行中..." : "テスト実行"}
        </button>
      </div>
      {testCodeMutation.error && (
        <div className="submit-message" style={{ color: "#b00020" }}>
          {testCodeMutation.error.message}
        </div>
      )}
      {testCodeMutation.data && (
        <div className="problem-view" style={{ marginTop: "12px" }}>
          <h3>実行結果</h3>
          <div>exitCode: {testCodeMutation.data.exitCode}</div>
          <div>duration: {testCodeMutation.data.durationMs} ms</div>
          <h4>stdout</h4>
          <pre className="problem-statement">{testCodeMutation.data.stdout || "(empty)"}</pre>
          <h4>stderr</h4>
          <pre className="problem-statement">{testCodeMutation.data.stderr || "(empty)"}</pre>
        </div>
      )}
    </form>
  );
}
