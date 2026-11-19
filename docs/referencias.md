# Gramáticas de referência

As gramáticas usadas no Gamida servem de fonte para conferir o vocabulário, as frases e as lições:

- **Hebraico:** Page H. Kelley, *Hebraico Bíblico: uma gramática introdutória* (Sinodal).
- **Grego:** *Introdução ao Grego Bíblico* (o livro-base das lições `bergmann_*`).

## Onde ficam

Os PDFs são livros com direitos autorais. **Não entram no repositório**: o repositório é publicado, e pôr o livro nele seria distribuí-lo. A pasta `referencias/` está no `.gitignore`.

Para consultar numa sessão de trabalho (inclusive com o Claude), copie os PDFs para `referencias/`:

- `referencias/Kelley - Hebraico Bíblico.pdf` (453 páginas)
- `referencias/Introdução ao Grego Bíblico.pdf`

Uma sessão nova do Claude começa com o repositório limpo, então os PDFs precisam ser enviados de novo quando forem necessários.

## Dicas de leitura

- **No Kelley, o hebraico está numa fonte antiga.** A extração de texto (`pdftotext`) sai ilegível no hebraico; o português sai bem. Para ler o hebraico, abra a página como imagem.
- **Exercícios do Kelley:** procure "Traduza as seguintes frases" no texto extraído para achar a página. A página do PDF é a do livro mais 1 ou 2.
- **Frases do Gamida:** as frases das lições (`sentences` em `data/hebrew_chapters.json`) foram tiradas desses exercícios, mas não são todas. Na Lição VI, por exemplo, há 10 das 30 frases dos exercícios 4 e 5.
