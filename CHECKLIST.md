@'
# CHECKLIST — CODESYNC | CHECKPOINT 3

## 1. GitHub e organização
- [x] Criar repositório no GitHub
- [x] Enviar código do Checkpoint 3
- [x] Registrar commit do backend, banco e AWS
- [x] Realizar clone do repositório
- [ ] Confirmar git pull de todos os integrantes
- [ ] Verificar atualização das branches
- [ ] Garantir que .env e senhas não foram publicados

## 2. Banco de dados — Responsável: Sara
- [x] Instalar e acessar MySQL
- [x] Executar comandos SQL de configuração
- [x] Definir usuário codesync_user
- [ ] Validar login com codesync_user
- [ ] Confirmar banco codesync
- [ ] Criar/verificar tabelas
- [ ] Validar relacionamentos e chaves
- [ ] Inserir dados de teste
- [ ] Testar conexão com backend
- [ ] Validar persistência dos dados

## 3. Backend — Responsável: Colega
- [x] Incluir arquitetura no Checkpoint 3
- [x] Clonar repositório
- [ ] Executar npm install
- [ ] Configurar .env local
- [ ] Verificar package.json
- [ ] Iniciar servidor Express
- [ ] Identificar rotas existentes
- [ ] Testar endpoints GET
- [ ] Testar endpoints POST
- [ ] Testar endpoints PUT/PATCH
- [ ] Testar endpoints DELETE
- [ ] Validar códigos HTTP e erros
- [ ] Integrar backend com MySQL

## 4. Docker
- [x] Verificar Docker Compose
- [x] Identificar configuração Compose
- [ ] Configurar MYSQL_ROOT_PASSWORD
- [ ] Executar docker compose config
- [ ] Executar docker compose up -d
- [ ] Conferir docker compose ps
- [ ] Analisar logs dos contêineres
- [ ] Testar comunicação dos serviços
- [ ] Validar persistência do banco

## 5. Testes e integração
- [ ] Criar roteiro de testes
- [ ] Testar Node.js + MySQL
- [ ] Validar operações CRUD implementadas
- [ ] Testar entradas inválidas
- [ ] Registrar evidências
- [ ] Corrigir erros encontrados
- [ ] Reexecutar testes

## 6. AWS e arquitetura
- [x] Referenciar AWS no commit do projeto
- [ ] Identificar serviços AWS configurados
- [ ] Validar diagrama da arquitetura
- [ ] Explicar fluxo aplicação/API/banco
- [ ] Separar funcionalidades prontas e planejadas

## 7. Apresentação
- [ ] Revisar requisitos do Checkpoint 3
- [ ] Criar slides
- [ ] Explicar objetivo do CodeSync
- [ ] Apresentar arquitetura
- [ ] Apresentar banco de dados
- [ ] Demonstrar backend funcionando
- [ ] Mostrar testes executados
- [ ] Dividir falas dos integrantes
- [ ] Preparar demonstração prática
- [ ] Ensaiar apresentação
- [ ] Revisar entrega final

## PRIORIDADES
1. Finalizar e validar banco de dados
2. Iniciar e testar servidor Express
3. Integrar backend com MySQL
4. Corrigir erros encontrados
5. Preparar demonstração e apresentação
'@ | Set-Content -Path "CHECKLIST.md" -Encoding UTF8