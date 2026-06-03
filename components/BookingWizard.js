'use client';

import { useState, useEffect } from 'react';
import styles from './BookingWizard.module.css';
import { 
  getCentros, 
  getProfissionais, 
  getOpcoes, 
  getDias, 
  getHorarios, 
  getAgendasLivres, 
  agendar 
} from '../services/api';
import { Check, ChevronRight, ChevronDown, AlertCircle, Loader2, Search, ArrowLeft, Calendar, User, Activity, Phone } from 'lucide-react';

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Data states
  const [centros, setCentros] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [opcoes, setOpcoes] = useState({ convenios: [], exames: [] });
  const [agendas, setAgendas] = useState([]);

  // Selection states
  const [selectedCentro, setSelectedCentro] = useState(null);
  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [selectedConvenio, setSelectedConvenio] = useState(null);
  const [selectedExame, setSelectedExame] = useState(null);
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formData, setFormData] = useState({ nome: '', telefone: '' });

  // 1. Fetch Centros on mount
  useEffect(() => {
    async function loadCentros() {
      setLoading(true);
      try {
        const data = await getCentros();
        setCentros(data || []);
      } catch (err) {
        setError('Falha ao carregar centros. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    loadCentros();
  }, []);

  // Clear search on step change
  useEffect(() => {
    setSearchQuery('');
  }, [step]);

  // Handlers
  const handleCentroSelect = async (centro) => {
    setSelectedCentro(centro);
    setLoading(true);
    try {
      const profs = await getProfissionais(centro.CEN_CODIGO);
      setProfissionais(profs || []);
      setStep(2);
    } catch (err) {
      setError('Falha ao carregar profissionais.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfissionalSelect = async (prof) => {
    setSelectedProfissional(prof);
    setLoading(true);
    try {
      const dataOpcoes = await getOpcoes(selectedCentro.CEN_CODIGO, prof.PROF_CODIGO, prof.CONS_CODIGO, prof.PROF_ESTADO_CONS);
      
      const convs = dataOpcoes.filter(o => o.TIPO === 'CONVENIO');
      const exames = dataOpcoes.filter(o => o.TIPO === 'EXAME');
      
      setOpcoes({ convenios: convs, exames: exames });
      setStep(3);
    } catch (err) {
      setError('Falha ao carregar opções.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpcoesSubmit = async () => {
    if (!selectedConvenio || !selectedExame) {
      setError('Selecione um convênio e um exame/procedimento.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const prof = selectedProfissional;
      const dias = await getDias(selectedCentro.CEN_CODIGO, prof.PROF_CODIGO, prof.CONS_CODIGO, prof.PROF_ESTADO_CONS);
      
      if (dias && dias.length > 0) {
        const dia = dias[0];
        const horarios = await getHorarios(selectedCentro.CEN_CODIGO, prof.PROF_CODIGO, prof.CONS_CODIGO, prof.PROF_ESTADO_CONS, dia.HAG_DIA);
        
        if (horarios && horarios.length > 0) {
          const hor = horarios[0];
          const agendasLivres = await getAgendasLivres(dia.HAG_DIA, hor.AGD_CODIGO, hor.HDI_CODIGO, 4);
          const agendasWithCodes = (agendasLivres || []).map(a => ({
            ...a,
            agd_codigo: hor.AGD_CODIGO,
            hdi_codigo: hor.HDI_CODIGO
          }));
          setAgendas(agendasWithCodes);
          setStep(4);
        } else {
          setError('Nenhum horário disponível para os dias deste profissional.');
        }
      } else {
        setError('Nenhum dia disponível.');
      }
    } catch (err) {
      setError('Falha ao buscar agendas.');
    } finally {
      setLoading(false);
    }
  };

  const handleAgendaSelect = (agenda) => {
    setSelectedAgenda(agenda);
    setStep(5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.telefone) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        dia: selectedAgenda.Dia,
        agd_codigo: selectedAgenda.agd_codigo || 55,
        hdi_codigo: selectedAgenda.hdi_codigo || 10,
        data: selectedAgenda.Data,
        nome: formData.nome,
        telefone: formData.telefone,
        cnv_codigo: Number(selectedConvenio.CODIGO),
        exa_codigo: selectedExame.CODIGO
      };
      
      const res = await agendar(payload);
      if (res && res[0] && res[0].OK === 1) {
        setSuccess(true);
      } else {
        setError('Erro ao concluir agendamento.');
      }
    } catch (err) {
      setError(err.message || 'Erro na requisição de agendamento.');
    } finally {
      setLoading(false);
    }
  };

  // Helper helper
  const getMonthName = (monthStr) => {
    const months = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };
    return months[monthStr] || '';
  };

  // Filtering lists
  const filteredCentros = centros.filter(c => 
    c.CEN_DESCRICAO.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.CEN_CODIGO.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProfissionais = profissionais.filter(p => 
    p.PROF_NOME.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render helpers
  const stepLabels = ['Especialidade', 'Profissional', 'Dados', 'Data', 'Confirmação'];
  const renderStepIndicator = () => (
    <div className={styles.stepperContainer}>
      <div className={styles.stepper}>
        {stepLabels.map((label, idx) => {
          const i = idx + 1;
          const isCompleted = step > i;
          const isActive = step === i;
          return (
            <div key={i} className={`${styles.stepWrapper} ${isActive ? styles.stepWrapperActive : ''}`}>
              <div className={`${styles.stepDot} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}>
                {isCompleted ? <Check size={14} /> : i}
              </div>
              <span className={`${styles.stepLabel} ${isActive || isCompleted ? styles.stepLabelActive : ''}`}>{label}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.progressBarBg}>
        <div className={styles.progressBar} style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }} />
      </div>
    </div>
  );

  if (success) {
    return (
      <div className={styles.wizardContainer}>
        <div className={styles.successState}>
          <div className={styles.successIcon}><Check size={40} /></div>
          <h3>Agendamento Confirmado!</h3>
          <p className={styles.successIntro}>Sua consulta/exame foi marcada com sucesso. Detalhes da reserva:</p>
          
          <div className={styles.successCard}>
            <div className={styles.successCardItem}>
              <User size={18} className={styles.successCardIcon} />
              <div>
                <span className={styles.successCardLabel}>Paciente</span>
                <span className={styles.successCardValue}>{formData.nome}</span>
              </div>
            </div>
            
            <div className={styles.successCardItem}>
              <Phone size={18} className={styles.successCardIcon} />
              <div>
                <span className={styles.successCardLabel}>WhatsApp / Celular</span>
                <span className={styles.successCardValue}>{formData.telefone}</span>
              </div>
            </div>

            <div className={styles.successCardItem}>
              <Calendar size={18} className={styles.successCardIcon} />
              <div>
                <span className={styles.successCardLabel}>Data & Dia</span>
                <span className={styles.successCardValue}>{selectedAgenda?.Data} ({selectedAgenda?.Dia?.toUpperCase()})</span>
              </div>
            </div>

            <div className={styles.successCardItem}>
              <Activity size={18} className={styles.successCardIcon} />
              <div>
                <span className={styles.successCardLabel}>Especialidade</span>
                <span className={styles.successCardValue}>{selectedCentro?.CEN_DESCRICAO}</span>
              </div>
            </div>

            <div className={styles.successCardItem}>
              <User size={18} className={styles.successCardIcon} />
              <div>
                <span className={styles.successCardLabel}>Profissional</span>
                <span className={styles.successCardValue}>{selectedProfissional?.PROF_NOME} ({selectedProfissional?.CONS_CODIGO})</span>
              </div>
            </div>

            <div className={styles.successCardItem}>
              <Activity size={18} className={styles.successCardIcon} />
              <div>
                <span className={styles.successCardLabel}>Procedimento & Convênio</span>
                <span className={styles.successCardValue}>{selectedExame?.DESCRICAO} • {selectedConvenio?.DESCRICAO}</span>
              </div>
            </div>
          </div>

          <p className={styles.successNote}>Nossa equipe entrará em contato para confirmação final.</p>
          
          <button className="btn-primary" onClick={() => window.location.reload()} style={{marginTop: '2rem'}}>
            Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizardContainer}>
      {renderStepIndicator()}
      
      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className={styles.loaderOverlay}>
          <Loader2 className={styles.spinner} size={40} />
          <p>Carregando...</p>
        </div>
      )}

      <div className={styles.stepContent}>
        {step > 1 && (
          <button className={styles.backBtn} onClick={() => setStep(step - 1)}>
            <ArrowLeft size={16} /> Voltar
          </button>
        )}

        {step === 1 && (
          <div className={styles.fadeEnter}>
            <h3 className={styles.stepTitle}>Qual o tipo de atendimento?</h3>
            
            <div className={styles.dropdownContainer}>
              <div 
                className={styles.dropdownTrigger}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>{selectedCentro ? `${selectedCentro.CEN_CODIGO} - ${selectedCentro.CEN_DESCRICAO}` : 'Escolha uma especialidade ou exame...'}</span>
                <ChevronDown size={20} className={styles.dropdownArrow} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </div>
              
              {dropdownOpen && (
                <>
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className={`${styles.dropdownMenu} glass`} style={{ zIndex: 10 }}>
                    <div className={styles.dropdownSearchWrapper}>
                      <Search size={16} className={styles.dropdownSearchIcon} />
                      <input
                        type="text"
                        placeholder="Digitar para buscar..."
                        className={styles.dropdownSearchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className={styles.dropdownOptionsList}>
                      {filteredCentros.map((cen) => (
                        <div 
                          key={cen.CEN_CODIGO} 
                          className={styles.dropdownOption}
                          onClick={() => {
                            handleCentroSelect(cen);
                            setDropdownOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <span className={styles.optionCode}>{cen.CEN_CODIGO}</span>
                          <span className={styles.optionDesc} title={cen.CEN_DESCRICAO}>{cen.CEN_DESCRICAO}</span>
                        </div>
                      ))}
                      {filteredCentros.length === 0 && (
                        <p className={styles.noResults} style={{ padding: '1rem' }}>Nenhuma especialidade encontrada.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.fadeEnter}>
            <h3 className={styles.stepTitle}>Escolha o Profissional</h3>

            <div className={styles.searchWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar por médico ou profissional..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.gridListProfs}>
              {filteredProfissionais.map((prof) => (
                <button 
                  key={prof.PROF_CODIGO} 
                  className={styles.selectCardProf}
                  onClick={() => handleProfissionalSelect(prof)}
                >
                  <div className={styles.profAvatar}>
                    {prof.PROF_NOME.charAt(0)}
                  </div>
                  <div className={styles.profInfo}>
                    <span className={styles.profName}>{prof.PROF_NOME}</span>
                    <span className={styles.profSub}>{prof.CONS_CODIGO} / {prof.PROF_ESTADO_CONS}</span>
                  </div>
                  <ChevronRight className={styles.cardArrow} size={16} />
                </button>
              ))}
            </div>
            {filteredProfissionais.length === 0 && !loading && (
              <p className={styles.noResults}>Nenhum profissional encontrado.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className={styles.fadeEnter}>
            <h3 className={styles.stepTitle}>Selecione Convênio e Exame</h3>
            
            <div className={styles.optionSection}>
              <h4 className={styles.optionSectionTitle}>Selecione o Convênio</h4>
              <div className={styles.chipsGrid}>
                {opcoes.convenios.map(c => {
                  const isSelected = selectedConvenio?.CODIGO === c.CODIGO;
                  return (
                    <button
                      key={c.CODIGO}
                      className={`${styles.chipCard} ${isSelected ? styles.chipCardSelected : ''}`}
                      onClick={() => setSelectedConvenio(c)}
                    >
                      {c.DESCRICAO}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.optionSection} style={{ marginTop: '2rem' }}>
              <h4 className={styles.optionSectionTitle}>Selecione o Procedimento</h4>
              <div className={styles.chipsGrid}>
                {opcoes.exames.map(ex => {
                  const isSelected = selectedExame?.CODIGO === ex.CODIGO;
                  return (
                    <button
                      key={ex.CODIGO}
                      className={`${styles.chipCard} ${isSelected ? styles.chipCardSelected : ''}`}
                      onClick={() => setSelectedExame(ex)}
                    >
                      {ex.DESCRICAO}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              className={`btn-primary ${styles.fullWidth}`} 
              onClick={handleOpcoesSubmit}
              disabled={!selectedConvenio || !selectedExame}
              style={{ opacity: (!selectedConvenio || !selectedExame) ? 0.6 : 1, marginTop: '2.5rem' }}
            >
              Ver Horários Disponíveis
            </button>
          </div>
        )}

        {step === 4 && (
          <div className={styles.fadeEnter}>
            <h3 className={styles.stepTitle}>Datas Disponíveis</h3>
            
            <div className={styles.dateGrid}>
              {agendas.filter(a => a.Livres > 0).map((ag, idx) => (
                <button 
                  key={idx} 
                  className={styles.dateSelectorCard}
                  onClick={() => handleAgendaSelect(ag)}
                >
                  <span className={styles.dateDayName}>{ag.Dia.toUpperCase()}</span>
                  <span className={styles.dateDayNumber}>{ag.Data.split('/')[0]}</span>
                  <span className={styles.dateMonthName}>{getMonthName(ag.Data.split('/')[1])}</span>
                  <span className={styles.dateVagasBadge}>{ag.Livres} vagas</span>
                </button>
              ))}
            </div>
            {agendas.length === 0 && !loading && <p className={styles.noResults}>Nenhuma data com vagas disponível.</p>}
          </div>
        )}

        {step === 5 && (
          <div className={styles.fadeEnter}>
            <h3 className={styles.stepTitle}>Confirme Seus Dados</h3>
            
            <div className={styles.summaryContainer}>
              <div className={styles.summaryItem}>
                <Calendar className={styles.summaryIcon} size={20} />
                <div>
                  <span className={styles.summaryLabel}>Data Selecionada</span>
                  <span className={styles.summaryValue}>{selectedAgenda.Data} ({selectedAgenda.Dia.toUpperCase()})</span>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <User className={styles.summaryIcon} size={20} />
                <div>
                  <span className={styles.summaryLabel}>Profissional</span>
                  <span className={styles.summaryValue}>{selectedProfissional.PROF_NOME}</span>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <Activity className={styles.summaryIcon} size={20} />
                <div>
                  <span className={styles.summaryLabel}>Procedimento & Convênio</span>
                  <span className={styles.summaryValue}>{selectedExame.DESCRICAO} • {selectedConvenio.DESCRICAO}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.formWrapper} style={{ marginTop: '2rem' }}>
              <div className={styles.formGroup}>
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  className={styles.textInput}
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                  placeholder="Digite seu nome completo"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Telefone / WhatsApp</label>
                <input 
                  type="tel" 
                  className={styles.textInput}
                  placeholder="Ex: 79 99999-8888"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  required
                />
              </div>
              
              <button type="submit" className={`btn-primary ${styles.fullWidth}`} style={{ marginTop: '2rem' }}>
                Confirmar Agendamento
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

