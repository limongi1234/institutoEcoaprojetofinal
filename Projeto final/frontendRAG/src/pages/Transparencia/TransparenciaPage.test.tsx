import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransparenciaPage } from './TransparenciaPage';
import { json, stubFetch } from '../../test/http';

// Fixture: contagens fictícias; a tela lê sempre a resposta da API.
const summary = {
  projeto: 'Projeto informado pelo servidor', scenario_id: 'cenario-teste',
  descricao: 'Resumo da API de teste', versao_manifesto: 'manifesto-teste', versao_corpus: 'v7-reparo',
  versao_inventario: 'v6 + suplemento sintético',
  corpus_ativo: {
    versao: 'v7-reparo', snapshot_id: 'candidato_08_vetores_completos', construido_em: '2026-10-26T17:45:00+00:00',
    total_documentos: 200, total_chunks: 300, total_vetores: 300, chunks_sem_vetor: 0,
    bytes_documents: 659605504, schema_sql: '7', vetores_por_base: { contratos_estruturado: 300 },
    avisos: ['Linhagem de embedding mista (fixture).', 'Proveniência de encoding não comprovada (fixture).',
      'Promoção para produção não autorizada (fixture).'],
  },
  snapshot_anterior: { versao: 'v6 + suplemento sintético', coletado_em: '2026-09-30T17:08:01+00:00',
    arquivos: 1425, backup: 'data/backup_v6_fixture' },
  coletado_em: null, inventario_completo: false, total_documentos: 123,
  total_itens: 456, total_falhas: 2,
  bases: [{ base_id: 'contratos_estruturado', natureza: 'estruturado', escopo: 'oficial',
    status: 'complete', documentos: 123, formatos: { json: 123 },
    documentos_ativos: 625, chunks_ativos: 106666, vetores_ativos: 106666 }],
};

describe('TransparenciaPage', () => {
  it('mantém os quatro princípios com o texto atualizado do pipeline', async () => {
    stubFetch(() => json(200, summary));
    render(<TransparenciaPage />);
    expect(screen.getByRole('heading', { name: 'Respostas a partir do acervo oficial' })).toBeInTheDocument();
    expect(screen.getByText(/calculados em SQL na base estruturada/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recusa quando não há evidência' })).toBeInTheDocument();
    expect(screen.getByText(/não é uma probabilidade de acerto/)).toBeInTheDocument();
    expect(screen.getByText(/histórico autorizado/)).toBeInTheDocument();
    await screen.findByText(summary.projeto);
  });

  it('mostra o snapshot verificado pela API, separa inventário e cobertura e preserva os avisos', async () => {
    const { calls } = stubFetch(() => json(200, summary));
    render(<TransparenciaPage />);
    await screen.findByText('Chunks normalizados');
    expect(screen.getAllByText('300')).toHaveLength(2);
    expect(screen.getByText('Vetores FAISS')).toBeInTheDocument();
    expect(screen.getByText('Cobertura vetorial')).toBeInTheDocument();
    expect(screen.getByText('Completa')).toBeInTheDocument();
    expect(screen.getByText('Schema SQL')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('v7-reparo')).toBeInTheDocument();
    expect(screen.getByText('v6 + suplemento sintético')).toBeInTheDocument();
    expect(screen.getByText('candidato_08_vetores_completos')).toBeInTheDocument();
    expect(screen.getByText('629 MB')).toBeInTheDocument();
    expect(screen.getByText(/Linhagem de embedding mista/)).toBeInTheDocument();
    expect(screen.getByText(/Proveniência de encoding não comprovada/)).toBeInTheDocument();
    expect(screen.getByText(/Promoção para produção não autorizada/)).toBeInTheDocument();
    expect(screen.getByText(/Inventário de coleta anterior v6/)).toBeInTheDocument();
    expect(screen.getByText(/data\/backup_v6_fixture/)).toBeInTheDocument();
    // Tabela de bases: chunks por base, sem coluna de vetores.
    expect(screen.getByRole('columnheader', { name: 'Chunks' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Vetores' })).not.toBeInTheDocument();
    expect(screen.getByText('106.666')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Situação' })).toBeInTheDocument();
    expect(calls[0].url.pathname).toBe('/api/v1/project/summary');
  });

  it('não declara cobertura completa quando a API informa lacunas', async () => {
    const partial = {
      ...summary,
      corpus_ativo: { ...summary.corpus_ativo, snapshot_id: 'candidato_07_reparo',
        total_vetores: 290, chunks_sem_vetor: 10 },
    };
    stubFetch(() => json(200, partial));
    render(<TransparenciaPage />);
    expect(await screen.findByText('Parcial (10 sem vetor)')).toBeInTheDocument();
    expect(screen.queryByText('Completa')).not.toBeInTheDocument();
  });

  it('não infere cobertura quando as contagens vetoriais não foram verificadas', async () => {
    const unknown = {
      ...summary,
      corpus_ativo: { ...summary.corpus_ativo, total_vetores: null, chunks_sem_vetor: null },
    };
    stubFetch(() => json(200, unknown));
    render(<TransparenciaPage />);
    expect(await screen.findByText('Não verificada')).toBeInTheDocument();
    expect(screen.queryByText('Completa')).not.toBeInTheDocument();
  });
});
