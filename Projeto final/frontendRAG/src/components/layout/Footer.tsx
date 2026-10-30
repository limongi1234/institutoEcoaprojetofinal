import ecoaLogo from '../../assets/ecoaPucRio.png';

export function Footer() {
  return (
    <footer className="nexo-footer" aria-label="Informações institucionais do projeto">
      <div className="nexo-footer-inner">
        <div className="nexo-footer-credits">
          <p className="footer-line-primary">
            Projeto desenvolvido durante a <strong>Residência em IA & RAG</strong>
          </p>
          <p className="footer-line-secondary">
            Instituto ECOA • PUC-Rio
          </p>
        </div>

        <div className="nexo-footer-emblem-wrap">
          <img
            src={ecoaLogo}
            alt="Instituto ECOA PUC-Rio"
            className="footer-emblem-img"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </footer>
  );
}
