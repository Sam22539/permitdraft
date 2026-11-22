import { Link } from "@tanstack/react-router";
import { useLang } from "../lib/lang";
import { resourcesSearch, type Stage } from "../lib/resources/data";

/** Contextual deep link to the public Resources hub. Passes a state only when the job states one explicitly; never derived. */
export function ResourceLink({ stage, state, className }: { stage: Stage; state?: string | null; className?: string }) {
  const { t } = useLang();
  const label: Record<Stage, [string, string]> = {
    setup: ["Official resources for job setup", "Recursos oficiales para configurar el trabajo"],
    new_job: ["Official resources for a new job", "Recursos oficiales para un trabajo nuevo"],
    equipment: ["Official resources for equipment and refrigerant", "Recursos oficiales de equipo y refrigerante"],
    permit: ["Official resources for the draft and permit", "Recursos oficiales del borrador y permiso"],
    install: ["Official resources for installation", "Recursos oficiales de instalación"],
    close_out: ["Official resources for inspection and closeout", "Recursos oficiales de inspección y cierre"],
    money: ["Official resources for money and incentives", "Recursos oficiales de dinero e incentivos"],
  };
  return (
    <p className={className ?? "cx-note"} data-testid={`resource-link-${stage}`}>
      <Link to="/resources" search={resourcesSearch(stage, state) as never} className="underline font-semibold">{t(...label[stage])}</Link>
      {" · "}{t("public links, separate from job readiness", "enlaces públicos, separados de la preparación del trabajo")}
    </p>
  );
}
