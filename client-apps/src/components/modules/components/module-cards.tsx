import { Cards } from "@/components/ui/cards";
import { useRouter } from "next/navigation";

interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  tag: string;
  path: string;
}

export const ModuleCard = ({
  icon,
  title,
  description,
  tag,
  path
}: ModuleCardProps) => {
  const router = useRouter();
  return (
    <Cards>
      <Cards.Body>
        <div className="cursor-pointer" role="button" onClick={()=>router.push(`/modules/${path}`)}>
          <div className="d-flex align-items-start justify-content-between mb-1">
            <div className="text-primary">
              <i className={`bi bi-${icon}`}></i>
            </div>
            <span
              className="bg-light py-1 px-2 rounded-pill fw-semibold"
              style={{ fontSize: "11px" }}
            >
              {tag}
            </span>
          </div>
          <h3 className="fw-semibold">{title}</h3>
          <p className="text-sm text-muted fs-6">{description}</p>
        </div>
      </Cards.Body>
    </Cards>
  );
};
