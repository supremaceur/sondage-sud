"use client";

import type { QuestionType } from "@/types";

export interface QuestionDraft {
  type: QuestionType;
  title: string;
  options: string[];
}

const questionTypeLabels: Record<QuestionType, string> = {
  mcq_single: "QCM — Choix unique",
  mcq_multiple: "QCM — Choix multiple",
  counter: "Compteur (nombre / note)",
  free_text: "Champ libre",
};

interface Props {
  index: number;
  question: QuestionDraft;
  onChange: (index: number, question: QuestionDraft) => void;
  onRemove: (index: number) => void;
}

export default function QuestionForm({ index, question, onChange, onRemove }: Props) {
  const hasOptions = question.type === "mcq_single" || question.type === "mcq_multiple";

  function updateField(field: Partial<QuestionDraft>) {
    onChange(index, { ...question, ...field });
  }

  function updateOption(optIndex: number, value: string) {
    const newOptions = [...question.options];
    newOptions[optIndex] = value;
    updateField({ options: newOptions });
  }

  function addOption() {
    updateField({ options: [...question.options, ""] });
  }

  function removeOption(optIndex: number) {
    updateField({ options: question.options.filter((_, i) => i !== optIndex) });
  }

  const inputStyle = {
    background: "#FAFAFA",
    borderColor: "var(--sud-border)",
    color: "var(--sud-black)",
  };

  return (
    <div
      className="rounded-xl p-5 border shadow-sm"
      style={{ background: "var(--sud-card)", borderColor: "var(--sud-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: "var(--sud-dark)" }}>Question {index + 1}</h3>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-sm transition"
          style={{ color: "#E60077" }}
        >
          Supprimer
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>Type</label>
          <select
            value={question.type}
            onChange={(e) =>
              updateField({
                type: e.target.value as QuestionType,
                options: (e.target.value === "mcq_single" || e.target.value === "mcq_multiple")
                  ? (question.options.length > 0 ? question.options : ["", ""])
                  : [],
              })
            }
            className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
            style={inputStyle}
          >
            {Object.entries(questionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>Intitulé</label>
          <input
            type="text"
            value={question.title}
            onChange={(e) => updateField({ title: e.target.value })}
            placeholder="Ex: Quel est votre avis sur..."
            required
            className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
            style={inputStyle}
          />
        </div>

        {hasOptions && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sud-muted)" }}>Options</label>
            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    required
                    className="flex-1 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
                    style={inputStyle}
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(optIndex)}
                      className="px-2 transition"
                      style={{ color: "#E60077" }}
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm transition font-medium"
              style={{ color: "#E60077" }}
            >
              + Ajouter une option
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
