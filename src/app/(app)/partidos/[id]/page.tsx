export default async function MatchPage({ params }: PageProps<"/partidos/[id]">) {
  const { id } = await params;
  return <p className="p-5">Partido {id}</p>;
}
