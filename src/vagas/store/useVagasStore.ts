import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Perfil, Candidatura, StatusCandidatura, ExperienciaItem, FormacaoItem } from '../types';

const PERFIL_KEY = 'vagas:perfil';
const CANDIDATURAS_KEY = 'vagas:candidaturas';

function loadPerfil(): Perfil {
  try {
    const raw = localStorage.getItem(PERFIL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    nome: '', email: '', telefone: '', cidade: '', estado: '',
    linkedin: '', crea: '', resumo: '', habilidades: [],
    experiencias: [], formacoes: [],
  };
}

function loadCandidaturas(): Candidatura[] {
  try {
    const raw = localStorage.getItem(CANDIDATURAS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

interface VagasStore {
  perfil: Perfil;
  candidaturas: Candidatura[];

  updatePerfil: (patch: Partial<Perfil>) => void;
  addHabilidade: (h: string) => void;
  removeHabilidade: (h: string) => void;
  addExperiencia: (e: Omit<ExperienciaItem, 'id'>) => void;
  updateExperiencia: (id: string, patch: Partial<ExperienciaItem>) => void;
  removeExperiencia: (id: string) => void;
  addFormacao: (f: Omit<FormacaoItem, 'id'>) => void;
  updateFormacao: (id: string, patch: Partial<FormacaoItem>) => void;
  removeFormacao: (id: string) => void;

  addCandidatura: (c: Omit<Candidatura, 'id' | 'dataCadastro'>) => void;
  updateCandidatura: (id: string, patch: Partial<Candidatura>) => void;
  removeCandidatura: (id: string) => void;
  moveStatus: (id: string, status: StatusCandidatura) => void;
}

export const useVagasStore = create<VagasStore>((set, get) => ({
  perfil: loadPerfil(),
  candidaturas: loadCandidaturas(),

  updatePerfil: (patch) => {
    const perfil = { ...get().perfil, ...patch };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  addHabilidade: (h) => {
    const perfil = { ...get().perfil };
    if (!perfil.habilidades.includes(h)) {
      perfil.habilidades = [...perfil.habilidades, h];
      localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
      set({ perfil });
    }
  },

  removeHabilidade: (h) => {
    const perfil = { ...get().perfil, habilidades: get().perfil.habilidades.filter(x => x !== h) };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  addExperiencia: (e) => {
    const perfil = { ...get().perfil, experiencias: [...get().perfil.experiencias, { ...e, id: nanoid() }] };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  updateExperiencia: (id, patch) => {
    const perfil = {
      ...get().perfil,
      experiencias: get().perfil.experiencias.map(x => x.id === id ? { ...x, ...patch } : x),
    };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  removeExperiencia: (id) => {
    const perfil = { ...get().perfil, experiencias: get().perfil.experiencias.filter(x => x.id !== id) };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  addFormacao: (f) => {
    const perfil = { ...get().perfil, formacoes: [...get().perfil.formacoes, { ...f, id: nanoid() }] };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  updateFormacao: (id, patch) => {
    const perfil = {
      ...get().perfil,
      formacoes: get().perfil.formacoes.map(x => x.id === id ? { ...x, ...patch } : x),
    };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  removeFormacao: (id) => {
    const perfil = { ...get().perfil, formacoes: get().perfil.formacoes.filter(x => x.id !== id) };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    set({ perfil });
  },

  addCandidatura: (c) => {
    const candidaturas = [
      ...get().candidaturas,
      { ...c, id: nanoid(), dataCadastro: new Date().toISOString().slice(0, 10) },
    ];
    localStorage.setItem(CANDIDATURAS_KEY, JSON.stringify(candidaturas));
    set({ candidaturas });
  },

  updateCandidatura: (id, patch) => {
    const candidaturas = get().candidaturas.map(x => x.id === id ? { ...x, ...patch } : x);
    localStorage.setItem(CANDIDATURAS_KEY, JSON.stringify(candidaturas));
    set({ candidaturas });
  },

  removeCandidatura: (id) => {
    const candidaturas = get().candidaturas.filter(x => x.id !== id);
    localStorage.setItem(CANDIDATURAS_KEY, JSON.stringify(candidaturas));
    set({ candidaturas });
  },

  moveStatus: (id, status) => {
    const candidaturas = get().candidaturas.map(x => x.id === id ? { ...x, status } : x);
    localStorage.setItem(CANDIDATURAS_KEY, JSON.stringify(candidaturas));
    set({ candidaturas });
  },
}));
